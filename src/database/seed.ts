import { NestFactory } from "@nestjs/core";
import { getModelToken } from "@nestjs/mongoose";
import * as bcrypt from "bcrypt";
import { Model } from "mongoose";
import { AppModule } from "../app.module";
import { Company, CompanyDocument } from "./schemas/company.schema";
// import { Customer, CustomerDocument } from './schemas/customer.schema';
import { Product, ProductDocument } from "./schemas/product.schema";
import { SalesRep, SalesRepDocument } from "./schemas/salesrep.schema";
import {
  SupplierReceipt,
  SupplierReceiptDocument,
} from "./schemas/sr-payment.schema";
import { User, UserDocument } from "./schemas/user.schema";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const companyModel = app.get<Model<CompanyDocument>>(
    getModelToken(Company.name),
  );
  const productModel = app.get<Model<ProductDocument>>(
    getModelToken(Product.name),
  );
  const salesRepModel = app.get<Model<SalesRepDocument>>(
    getModelToken(SalesRep.name),
  );
  const supplierReceiptModel = app.get<Model<SupplierReceiptDocument>>(
    getModelToken(SupplierReceipt.name),
  );
  // const customerModel = app.get<Model<CustomerDocument>>(getModelToken(Customer.name));

  try {
    console.log("🌱 Starting seed...");

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await userModel.deleteMany({});
    // await companyModel.deleteMany({});
    // await productModel.deleteMany({});
    // await salesRepModel.deleteMany({});
    // 1. Create Admin User
    const existingUser = await userModel.findOne({ email: "admin@dms.com" });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      const admin = await userModel.create({
        email: "admin@dms.com",
        password: hashedPassword,
        name: "Admin User",
        phone: "+8801234567890",
        isActive: true,
      });
      console.log("✅ Admin user created:", admin.email);
    } else {
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await userModel.updateOne(
        { email: "admin@dms.com" },
        { password: hashedPassword, isActive: true },
      );
      console.log("✅ Admin user password updated");
    }

    // 2. Create Companies (Suppliers)
    const companies = [
      {
        name: "Pran Foods Ltd",
        code: "PRAN-001",
        email: "contact@pran.com",
        phone: "+8801234567891",
        address: "Dhaka, Bangladesh",
        commissionRate: 6,
        isActive: true,
      },
      {
        name: "ACI Limited",
        code: "ACI-001",
        email: "info@aci-bd.com",
        phone: "+8801234567892",
        address: "Dhaka, Bangladesh",
        commissionRate: 5.5,
        isActive: true,
      },
      {
        name: "Square Pharmaceuticals",
        code: "SQUARE-001",
        email: "contact@squarepharma.com",
        phone: "+8801234567893",
        address: "Dhaka, Bangladesh",
        commissionRate: 7,
        isActive: true,
      },
    ];

    const createdCompanies = [];
    for (const companyData of companies) {
      const existing = await companyModel.findOne({ code: companyData.code });
      if (!existing) {
        const company = await companyModel.create(companyData);
        createdCompanies.push(company);
        console.log("✅ Company created:", company.name);
      } else {
        createdCompanies.push(existing);
        console.log("ℹ️  Company already exists:", companyData.name);
      }
    }

    // 3. Create Products
    const products = [
      {
        name: "Pran Noodles",
        sku: "PRAN-NOOD-001",
        companyId: createdCompanies[0]._id,
        category: "Food",
        unit: "pcs",
        dealerPrice: 100,
        commissionPercent: 6, // 6% commission from company (commissionRate)
        stock: 500,
        reorderLevel: 50,
        isActive: true,
      },
      {
        name: "Pran Biscuit",
        sku: "PRAN-BISC-001",
        companyId: createdCompanies[0]._id,
        category: "Food",
        unit: "pcs",
        dealerPrice: 50,
        commissionPercent: 5.5, // 5.5% commission from company
        stock: 1000,
        reorderLevel: 100,
        isActive: true,
      },
      {
        name: "ACI Salt",
        sku: "ACI-SALT-001",
        companyId: createdCompanies[1]._id,
        category: "Food",
        unit: "kg",
        dealerPrice: 80,
        commissionPercent: 7, // 7% commission from company
        stock: 300,
        reorderLevel: 30,
        isActive: true,
      },
      {
        name: "Square Paracetamol",
        sku: "SQ-PARA-001",
        companyId: createdCompanies[2]._id,
        category: "Medicine",
        unit: "box",
        dealerPrice: 200,
        commissionPercent: 6, // 6% commission from company
        stock: 200,
        reorderLevel: 20,
        isActive: true,
      },
    ];

    for (const productData of products) {
      const existing = await productModel.findOne({ sku: productData.sku });
      if (!existing) {
        // Calculate tradePrice from dealerPrice and commissionPercent
        const calculatedTP = Number(
          (
            productData.dealerPrice +
            productData.dealerPrice * (productData.commissionPercent / 100)
          ).toFixed(2),
        );
        const productWithTP = { ...productData, tradePrice: calculatedTP };
        await productModel.create(productWithTP);
        console.log(
          "✅ Product created:",
          productData.name,
          `(TP: ${calculatedTP})`,
        );
      } else {
        console.log("ℹ️  Product already exists:", productData.name);
      }
    }

    // 4. Create Sales Reps
    const salesReps = [
      {
        _id: "6952be3eed9c95d9d860fe8d", // Use the same ID as in SR issues
        name: "Sayman Rabbi",
        companyId: createdCompanies[0]._id, // KYC company (same as SR issues)
        phone: "01537134852",
        email: "mdrabbi.asm@gmail.com",
        address: "rangpur, road:02",
        isActive: true,
      },
      {
        name: "Rahim Uddin",
        companyId: createdCompanies[0]._id, // Pran Foods Ltd
        phone: "+8801712345678",
        email: "rahim@example.com",
        address: "Dhaka",
        isActive: true,
      },
      {
        name: "Karim Ahmed",
        companyId: createdCompanies[1]._id, // ACI Limited
        phone: "+8801712345679",
        email: "karim@example.com",
        address: "Chittagong",
        isActive: true,
      },
      {
        name: "Fatima Begum",
        companyId: createdCompanies[2]._id, // Square Pharmaceuticals
        phone: "+8801712345680",
        address: "Sylhet",
        isActive: true,
      },
    ];

    for (const srData of salesReps) {
      const existing = await salesRepModel.findOne({ phone: srData.phone });
      if (!existing) {
        await salesRepModel.create(srData);
        console.log("✅ Sales Rep created:", srData.name);
      } else {
        console.log("ℹ️  Sales Rep already exists:", srData.name);
      }
    }

    // Create sample supplier receipts
    const existingProducts = await productModel.find();
    const existingCompanies = await companyModel.find();

    if (existingProducts.length > 0 && existingCompanies.length > 0) {
      // Find the KYC company (the one being used in reports)
      const kycCompany =
        existingCompanies.find((c) => c.code === "KYC") || existingCompanies[0];

      const supplierReceipts = [
        {
          receiptNumber: "SUP-RCP-001",
          companyId: kycCompany._id, // KYC company (the one being queried)
          items: [
            {
              productId: existingProducts[0]._id.toString(),
              productName: existingProducts[0].name,
              sku: existingProducts[0].sku,
              quantity: 100,
              dealerPrice: 100,
              tradePrice: 106.5,
              unit: "pcs",
            },
            {
              productId: existingProducts[1]._id.toString(),
              productName: existingProducts[1].name,
              sku: existingProducts[1].sku,
              quantity: 50,
              dealerPrice: 50,
              tradePrice: 52.75,
              unit: "pcs",
            },
          ],
          totalValue: 15000,
          receiptDate: new Date("2025-12-15"),
          invoiceNumber: "INV-001",
        },
        {
          receiptNumber: "SUP-RCP-002",
          companyId: kycCompany._id, // KYC company
          items: [
            {
              productId: existingProducts[2]._id.toString(),
              productName: existingProducts[2].name,
              sku: existingProducts[2].sku,
              quantity: 80,
              dealerPrice: 80,
              tradePrice: 85.6,
              unit: "pcs",
            },
          ],
          totalValue: 6400,
          receiptDate: new Date("2025-12-20"),
          invoiceNumber: "INV-002",
        },
        {
          receiptNumber: "SUP-RCP-003",
          companyId: kycCompany._id, // KYC company
          items: [
            {
              productId: existingProducts[0]._id.toString(),
              productName: existingProducts[0].name,
              sku: existingProducts[0].sku,
              quantity: 200,
              dealerPrice: 95,
              tradePrice: 106.5,
              unit: "pcs",
            },
          ],
          totalValue: 19000,
          receiptDate: new Date("2025-12-25"),
          invoiceNumber: "INV-003",
        },
      ];

      for (const receiptData of supplierReceipts) {
        const existing = await supplierReceiptModel.findOne({
          receiptNumber: receiptData.receiptNumber,
        });
        if (!existing) {
          await supplierReceiptModel.create(receiptData);
          console.log(
            "✅ Supplier Receipt created:",
            receiptData.receiptNumber,
          );
        } else {
          console.log(
            "ℹ️  Supplier Receipt already exists:",
            receiptData.receiptNumber,
          );
        }
      }
    }

    console.log("🎉 Seed completed successfully!");
    console.log("\n📝 Login Credentials:");
    console.log("   Email: admin@dms.com");
    console.log("   Password: admin123");
  } catch (error) {
    console.error("❌ Seed failed:", error);
  } finally {
    await app.close();
  }
}

bootstrap();
