import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  CompanyClaim,
  CompanyClaimDocument,
} from "../../database/schemas/company-claim.schema";
import {
  Customer,
  CustomerDocument,
} from "../../database/schemas/customer.schema";
import {
  Product,
  ProductDocument,
} from "../../database/schemas/product.schema";
import {
  SRPayment,
  SRPaymentDocument,
} from "../../database/schemas/sr-payment.schema";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

@Injectable()
export class CustomersService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    @InjectModel(SRPayment.name)
    private readonly srPaymentModel: Model<SRPaymentDocument>,
    @InjectModel(CompanyClaim.name)
    private readonly companyClaimModel: Model<CompanyClaimDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateCustomerDto): Promise<Customer> {
    const existing = await this.customerModel
      .findOne({ code: dto.code })
      .exec();
    if (existing) {
      throw new ConflictException("Customer with this code already exists");
    }
    const created = new this.customerModel({
      ...dto,
      isActive: dto.isActive ?? true,
    });
    return created.save();
  }

  async findAll(): Promise<Customer[]> {
    return this.customerModel.find().sort({ name: 1 }).exec();
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.customerModel.findById(id).exec();
    if (!customer) {
      throw new NotFoundException("Customer not found");
    }
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto): Promise<Customer> {
    if (dto.code) {
      const existing = await this.customerModel
        .findOne({ code: dto.code, _id: { $ne: id } })
        .exec();
      if (existing) {
        throw new ConflictException("Customer with this code already exists");
      }
    }
    const updated = await this.customerModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException("Customer not found");
    }
    return updated;
  }

  async remove(id: string): Promise<void> {
    const res = await this.customerModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException("Customer not found");
    }
  }

  async getCustomerSummaries(
    companyId?: string,
    page: number = 1,
    limit: number = 10,
    searchQuery: string = "",
    startDate?: Date,
    endDate?: Date,
  ) {
    // Get all payments with customer info
    const paymentMatch: any = {};

    // TEMP: Skip date filtering for debugging

    if (companyId) {
      // TEMP: Try with string comparison instead of ObjectId

      const companyProducts = await this.productModel
        .find({
          $or: [
            { companyId: new Types.ObjectId(companyId) },
            { companyId: companyId },
            { "companyId._id": companyId },
          ],
        })
        .select("_id name")
        .exec();

      const productIds = companyProducts.map((p) => p._id.toString());

      if (productIds.length > 0) {
        paymentMatch["items.productId"] = { $in: productIds };
      } else {
        // No products for this company, return empty result

        return {
          customers: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
            hasNextPage: false,
            hasPrevPage: false,
          },
        };
      }
    } else {
    }

    // Use the same payment finding logic as reports service
    let payments = await this.srPaymentModel
      .find(paymentMatch)
      .sort({ paymentDate: -1 })
      .exec();

    // Filter payments that have customer info (same as reports)
    payments = payments.filter((payment) => payment.customerInfo?.name);

    // Group payments by customer
    const customerMap = new Map<string, any>();

    payments.forEach((payment) => {
      if (!payment.customerInfo?.name) return;

      const customerKey = `${payment.customerInfo.name}-${payment.customerInfo.phone || ""}`;

      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          name: payment.customerInfo.name,
          phone: payment.customerInfo.phone || "",
          address: payment.customerInfo.address || "",
          totalPaid: 0,
          totalDue: 0,
          totalDiscounts: 0,
          paymentCount: 0,
          lastPaymentDate: payment.paymentDate,
          payments: [],
          relatedClaims: [],
          totalClaimsValue: 0,
          paidClaimsValue: 0,
        });
      }

      const customer = customerMap.get(customerKey)!;
      customer.totalPaid += payment.receivedAmount || 0;
      customer.totalDue += payment.customerDue || 0;
      customer.totalDiscounts += payment.companyClaim || 0; // This is actually company claim amount
      customer.paymentCount += 1;

      // Update last payment date if this is more recent
      if (new Date(payment.paymentDate) > new Date(customer.lastPaymentDate)) {
        customer.lastPaymentDate = payment.paymentDate;
      }

      customer.payments.push(payment);
    });

    // Convert to array and apply search filter
    let customers = Array.from(customerMap.values());

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      customers = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(query) ||
          customer.phone.includes(query) ||
          (customer.address && customer.address.toLowerCase().includes(query)),
      );
    }

    // Sort by total paid (descending)
    customers.sort((a, b) => b.totalPaid - a.totalPaid);

    // Apply pagination
    const totalItems = customers.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCustomers = customers.slice(startIndex, endIndex);

    return {
      customers: paginatedCustomers,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  async searchCustomers(query: string, limit: number = 5) {
    const customers = await this.customerModel
      .find({
        $or: [
          { name: new RegExp(query, "i") },
          { phone: new RegExp(query, "i") },
          { code: new RegExp(query, "i") },
        ],
      })
      .limit(limit)
      .exec();

    return customers;
  }
}
