import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  Company,
  CompanyDocument,
} from "../../database/schemas/company.schema";
import {
  Product,
  ProductDocument,
} from "../../database/schemas/product.schema";
import {
  SupplierPayment,
  SupplierPaymentDocument,
  SupplierReceipt,
  SupplierReceiptDocument,
} from "../../database/schemas/sr-payment.schema";
import { CreateSupplierReceiptDto } from "./dto/create-supplier-receipt.dto";
import { UpdateSupplierReceiptDto } from "./dto/update-supplier-receipt.dto";

@Injectable()
export class SupplierReceiptsService {
  constructor(
    @InjectModel(SupplierReceipt.name)
    private readonly supplierReceiptModel: Model<SupplierReceiptDocument>,
    @InjectModel(SupplierPayment.name)
    private readonly supplierPaymentModel: Model<SupplierPaymentDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async generateReceiptNumber(): Promise<string> {
    const lastReceipt = await this.supplierReceiptModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();

    if (!lastReceipt || !lastReceipt.receiptNumber) {
      return "SUP-RCP-001";
    }

    const match = lastReceipt.receiptNumber.match(/SUP-RCP-(\d+)/);
    if (!match) {
      return "SUP-RCP-001";
    }

    const lastNumber = parseInt(match[1] || "0");
    const nextNumber = (lastNumber + 1).toString().padStart(3, "0");
    return `SUP-RCP-${nextNumber}`;
  }

  async create(dto: CreateSupplierReceiptDto): Promise<SupplierReceipt> {
    // Verify company exists
    const company = await this.companyModel.findById(dto.companyId).exec();
    if (!company) {
      throw new NotFoundException("Company not found");
    }

    // Verify all products exist and update stock
    for (const item of dto.items) {
      const product = await this.productModel.findById(item.productId).exec();
      if (!product) {
        throw new NotFoundException(`Product ${item.productName} not found`);
      }

      // Update product stock
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: item.quantity },
      });
    }

    // Auto-generate receipt number if not provided
    let receiptNumber = dto.receiptNumber;
    if (!receiptNumber) {
      let attempts = 0;
      let isUnique = false;
      while (!isUnique && attempts < 10) {
        receiptNumber = await this.generateReceiptNumber();
        const existing = await this.supplierReceiptModel
          .findOne({ receiptNumber })
          .exec();
        if (!existing) {
          isUnique = true;
        } else {
          attempts++;
          const match = receiptNumber.match(/SUP-RCP-(\d+)/);
          if (match) {
            const lastNumber = parseInt(match[1] || "0");
            const nextNumber = (lastNumber + attempts)
              .toString()
              .padStart(3, "0");
            receiptNumber = `SUP-RCP-${nextNumber}`;
          }
        }
      }
      if (!isUnique) {
        receiptNumber = `SUP-RCP-${Date.now()}`;
      }
    } else {
      // Check if receipt number exists
      const existing = await this.supplierReceiptModel
        .findOne({ receiptNumber })
        .exec();
      if (existing) {
        throw new NotFoundException("Receipt number already exists");
      }
    }

    const receipt = new this.supplierReceiptModel({
      ...dto,
      receiptNumber,
      receiptDate: dto.receiptDate || new Date(),
    });

    return receipt.save();
  }

  async findAll(): Promise<any[]> {
    const receiptsRaw = await this.supplierReceiptModel
      .find()
      .populate("companyId", "name code")
      .sort({ receiptDate: -1 })
      .exec();

    return receiptsRaw.map((receipt) => receipt.toObject());
  }

  async findOne(id: string): Promise<any> {
    const receipt = await this.supplierReceiptModel
      .findById(id)
      .populate("companyId", "name code")
      .exec();
    if (!receipt) {
      throw new NotFoundException("Supplier receipt not found");
    }

    return receipt.toObject();
  }

  async findByCompany(companyId: string): Promise<any[]> {
    const receiptsRaw = await this.supplierReceiptModel
      .find({ companyId })
      .populate("companyId", "name code")
      .sort({ receiptDate: -1 })
      .exec();

    return receiptsRaw.map((receipt) => receipt.toObject());
  }

  async update(
    id: string,
    dto: UpdateSupplierReceiptDto,
  ): Promise<SupplierReceipt> {
    if (dto.receiptNumber) {
      const existing = await this.supplierReceiptModel
        .findOne({ receiptNumber: dto.receiptNumber, _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new NotFoundException("Receipt number already exists");
      }
    }

    const updated = await this.supplierReceiptModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Supplier receipt not found");
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const result = await this.supplierReceiptModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException("Supplier receipt not found");
    }
  }

  // Get supplier balance summary
  async getSupplierBalance(companyId?: string) {
    console.log("🔍 getSupplierBalance called with companyId:", companyId);
    const matchCondition = companyId ? { companyId: companyId } : {};
    console.log("🔍 Balance match condition:", matchCondition);

    // Get all payments made to suppliers
    const supplierPayments = await this.supplierPaymentModel.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$companyId",
          totalPaid: { $sum: "$amount" },
          paymentCount: { $sum: 1 },
        },
      },
    ]);

    // Get all products received from suppliers using find instead of aggregation
    const allReceipts = await this.supplierReceiptModel.find(matchCondition);
    const receiptsMap = new Map();

    allReceipts.forEach((receipt) => {
      const companyId = receipt.companyId._id
        ? receipt.companyId._id.toString()
        : receipt.companyId.toString();

      const existing = receiptsMap.get(companyId) || {
        _id: receipt.companyId._id || receipt.companyId,
        totalReceived: 0,
        receiptCount: 0,
      };

      existing.totalReceived += receipt.totalValue;
      existing.receiptCount += 1;
      receiptsMap.set(companyId, existing);
    });

    const supplierReceipts = Array.from(receiptsMap.entries()).map(
      ([_companyId, data]) => ({
        _id: data._id,
        totalReceived: data.totalReceived,
        receiptCount: data.receiptCount,
      }),
    );

    console.log(
      "🧾 Supplier receipts manual aggregation result:",
      supplierReceipts,
    );

    // Combine the data
    const balanceMap = new Map();

    supplierPayments.forEach((payment) => {
      balanceMap.set(payment._id.toString(), {
        companyId: payment._id,
        totalPaid: payment.totalPaid,
        paymentCount: payment.paymentCount,
        totalReceived: 0,
        receiptCount: 0,
        balance: -payment.totalPaid, // Payments reduce what we owe (negative = supplier owes us)
      });
    });

    supplierReceipts.forEach((receipt) => {
      // Skip receipts with null companyId
      if (!receipt._id) {
        console.warn(
          "⚠️ Skipping receipt with null companyId in balance calculation",
        );
        return;
      }

      const companyId = receipt._id.toString(); // Now _id is the company ObjectId string

      const existing = balanceMap.get(companyId) || {
        companyId: receipt._id,
        totalPaid: 0,
        paymentCount: 0,
        totalReceived: 0,
        receiptCount: 0,
        balance: 0,
      };
      existing.totalReceived += receipt.totalReceived; // Accumulate received value
      existing.receiptCount += receipt.receiptCount; // Accumulate receipt count
      existing.balance = existing.totalReceived - existing.totalPaid; // Positive = we owe supplier, Negative = supplier owes us
      balanceMap.set(companyId, existing);
    });

    // Also update balances for companies that only have payments but no receipts
    balanceMap.forEach((value, _key) => {
      if (value.totalReceived === 0 && value.totalPaid > 0) {
        value.balance = -value.totalPaid; // Only payments = supplier owes us
      }
    });

    return Array.from(balanceMap.values());
  }

  async findAllWithFilters(filters: {
    companyId?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
    page: number;
    limit: number;
  }) {
    const { companyId, startDate, endDate, search, page, limit } = filters;

    console.log("🔍 Backend: findAllWithFilters called with:", {
      companyId,
      startDate,
      endDate,
      search,
      page,
      limit,
    });

    // Build query conditions
    const query: any = {};

    if (companyId) {
      query.companyId = companyId;
    }

    if (startDate || endDate) {
      query.receiptDate = {};
      if (startDate) {
        query.receiptDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.receiptDate.$lte = new Date(
          new Date(endDate).setHours(23, 59, 59, 999),
        ); // End of day
      }
    }

    // Use Mongoose find with populate instead of aggregation
    const receiptsQuery = this.supplierReceiptModel
      .find(query)
      .populate("companyId", "name code")
      .sort({ receiptDate: -1 });

    // Get total count for pagination
    const total = await this.supplierReceiptModel.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Apply pagination
    const receipts = await receiptsQuery
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const receiptsRaw = receipts.map((receipt) => receipt.toObject());
    const totalReceiptsValue = receiptsRaw.reduce(
      (sum, r) => sum + r.totalValue,
      0,
    );

    console.log(
      "✅ Backend: Documents returned after find with populate:",
      receiptsRaw.length,
    );

    return {
      receipts: receiptsRaw,
      total,
      page,
      limit,
      totalPages,
      totalReceiptsValue,
    };
  }

  async testBalance(companyId?: string) {
    console.log("🔍 Service: Test balance called with companyId:", companyId);
    if (!companyId) {
      return { error: "companyId required" };
    }

    try {
      const companyObjectId = new Types.ObjectId(companyId);
      const [totalPaid, totalReceived] = await Promise.all([
        this.supplierPaymentModel
          .find({ companyId: companyObjectId })
          .select("amount")
          .then((docs) => {
            const sum = docs.reduce((sum, doc) => sum + doc.amount, 0);
            console.log(
              "🔍 Test: Total Paid:",
              sum,
              "from",
              docs.length,
              "payments",
            );
            return sum;
          }),
        this.supplierReceiptModel
          .find({ companyId: companyObjectId })
          .select("totalValue")
          .then((docs) => {
            const sum = docs.reduce((sum, doc) => sum + doc.totalValue, 0);
            console.log(
              "🔍 Test: Total Received:",
              sum,
              "from",
              docs.length,
              "receipts",
            );
            return sum;
          }),
      ]);

      const balance = totalReceived - totalPaid;
      console.log("🔍 Test: Final balance:", balance);

      return {
        companyId,
        totalPaid,
        totalReceived,
        balance,
        message: "Test balance calculation completed",
      };
    } catch (error) {
      console.error("🔍 Test: Error:", error);
      return { error: error.message };
    }
  }
}
