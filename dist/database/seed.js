"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = require("bcrypt");
const app_module_1 = require("../app.module");
const company_schema_1 = require("./schemas/company.schema");
const product_schema_1 = require("./schemas/product.schema");
const salesrep_schema_1 = require("./schemas/salesrep.schema");
const sr_payment_schema_1 = require("./schemas/sr-payment.schema");
const user_schema_1 = require("./schemas/user.schema");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userModel = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
    const companyModel = app.get((0, mongoose_1.getModelToken)(company_schema_1.Company.name));
    const productModel = app.get((0, mongoose_1.getModelToken)(product_schema_1.Product.name));
    const salesRepModel = app.get((0, mongoose_1.getModelToken)(salesrep_schema_1.SalesRep.name));
    const supplierReceiptModel = app.get((0, mongoose_1.getModelToken)(sr_payment_schema_1.SupplierReceipt.name));
    try {
        console.log("🌱 Starting seed...");
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
        }
        else {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await userModel.updateOne({ email: "admin@dms.com" }, { password: hashedPassword, isActive: true });
            console.log("✅ Admin user password updated");
        }
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
            }
            else {
                createdCompanies.push(existing);
                console.log("ℹ️  Company already exists:", companyData.name);
            }
        }
        const products = [
            {
                name: "Pran Noodles",
                sku: "PRAN-NOOD-001",
                companyId: createdCompanies[0]._id,
                category: "Food",
                unit: "pcs",
                dealerPrice: 100,
                commissionPercent: 6,
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
                commissionPercent: 5.5,
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
                commissionPercent: 7,
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
                commissionPercent: 6,
                stock: 200,
                reorderLevel: 20,
                isActive: true,
            },
        ];
        for (const productData of products) {
            const existing = await productModel.findOne({ sku: productData.sku });
            if (!existing) {
                const calculatedTP = Number((productData.dealerPrice +
                    productData.dealerPrice * (productData.commissionPercent / 100)).toFixed(2));
                const productWithTP = Object.assign(Object.assign({}, productData), { tradePrice: calculatedTP });
                await productModel.create(productWithTP);
                console.log("✅ Product created:", productData.name, `(TP: ${calculatedTP})`);
            }
            else {
                console.log("ℹ️  Product already exists:", productData.name);
            }
        }
        const salesReps = [
            {
                _id: "6952be3eed9c95d9d860fe8d",
                name: "Sayman Rabbi",
                companyId: createdCompanies[0]._id,
                phone: "01537134852",
                email: "mdrabbi.asm@gmail.com",
                address: "rangpur, road:02",
                isActive: true,
            },
            {
                name: "Rahim Uddin",
                companyId: createdCompanies[0]._id,
                phone: "+8801712345678",
                email: "rahim@example.com",
                address: "Dhaka",
                isActive: true,
            },
            {
                name: "Karim Ahmed",
                companyId: createdCompanies[1]._id,
                phone: "+8801712345679",
                email: "karim@example.com",
                address: "Chittagong",
                isActive: true,
            },
            {
                name: "Fatima Begum",
                companyId: createdCompanies[2]._id,
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
            }
            else {
                console.log("ℹ️  Sales Rep already exists:", srData.name);
            }
        }
        const existingProducts = await productModel.find();
        const existingCompanies = await companyModel.find();
        if (existingProducts.length > 0 && existingCompanies.length > 0) {
            const kycCompany = existingCompanies.find((c) => c.code === "KYC") || existingCompanies[0];
            const supplierReceipts = [
                {
                    receiptNumber: "SUP-RCP-001",
                    companyId: kycCompany._id,
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
                    companyId: kycCompany._id,
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
                    companyId: kycCompany._id,
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
                    console.log("✅ Supplier Receipt created:", receiptData.receiptNumber);
                }
                else {
                    console.log("ℹ️  Supplier Receipt already exists:", receiptData.receiptNumber);
                }
            }
        }
        console.log("🎉 Seed completed successfully!");
        console.log("\n📝 Login Credentials:");
        console.log("   Email: admin@dms.com");
        console.log("   Password: admin123");
    }
    catch (error) {
        console.error("❌ Seed failed:", error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map