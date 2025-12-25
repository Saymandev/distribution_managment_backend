"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const mongoose_1 = require("@nestjs/mongoose");
const bcrypt = require("bcrypt");
const app_module_1 = require("../app.module");
const company_schema_1 = require("./schemas/company.schema");
const customer_schema_1 = require("./schemas/customer.schema");
const product_schema_1 = require("./schemas/product.schema");
const salesrep_schema_1 = require("./schemas/salesrep.schema");
const user_schema_1 = require("./schemas/user.schema");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userModel = app.get((0, mongoose_1.getModelToken)(user_schema_1.User.name));
    const companyModel = app.get((0, mongoose_1.getModelToken)(company_schema_1.Company.name));
    const productModel = app.get((0, mongoose_1.getModelToken)(product_schema_1.Product.name));
    const salesRepModel = app.get((0, mongoose_1.getModelToken)(salesrep_schema_1.SalesRep.name));
    const customerModel = app.get((0, mongoose_1.getModelToken)(customer_schema_1.Customer.name));
    try {
        console.log('🌱 Starting seed...');
        const existingUser = await userModel.findOne({ email: 'admin@dms.com' });
        if (!existingUser) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const admin = await userModel.create({
                email: 'admin@dms.com',
                password: hashedPassword,
                name: 'Admin User',
                phone: '+8801234567890',
                isActive: true,
            });
            console.log('✅ Admin user created:', admin.email);
        }
        else {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await userModel.updateOne({ email: 'admin@dms.com' }, { password: hashedPassword, isActive: true });
            console.log('✅ Admin user password updated');
        }
        const companies = [
            {
                name: 'Pran Foods Ltd',
                code: 'PRAN-001',
                email: 'contact@pran.com',
                phone: '+8801234567891',
                address: 'Dhaka, Bangladesh',
                commissionRate: 6,
                isActive: true,
            },
            {
                name: 'ACI Limited',
                code: 'ACI-001',
                email: 'info@aci-bd.com',
                phone: '+8801234567892',
                address: 'Dhaka, Bangladesh',
                commissionRate: 5.5,
                isActive: true,
            },
            {
                name: 'Square Pharmaceuticals',
                code: 'SQUARE-001',
                email: 'contact@squarepharma.com',
                phone: '+8801234567893',
                address: 'Dhaka, Bangladesh',
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
                console.log('✅ Company created:', company.name);
            }
            else {
                createdCompanies.push(existing);
                console.log('ℹ️  Company already exists:', companyData.name);
            }
        }
        const products = [
            {
                name: 'Pran Noodles',
                sku: 'PRAN-NOOD-001',
                companyId: createdCompanies[0]._id,
                category: 'Food',
                unit: 'pcs',
                dealerPrice: 100,
                tradePrice: 95,
                stock: 500,
                reorderLevel: 50,
                isActive: true,
            },
            {
                name: 'Pran Biscuit',
                sku: 'PRAN-BISC-001',
                companyId: createdCompanies[0]._id,
                category: 'Food',
                unit: 'pcs',
                dealerPrice: 50,
                tradePrice: 48,
                stock: 1000,
                reorderLevel: 100,
                isActive: true,
            },
            {
                name: 'ACI Salt',
                sku: 'ACI-SALT-001',
                companyId: createdCompanies[1]._id,
                category: 'Food',
                unit: 'kg',
                dealerPrice: 80,
                tradePrice: 75,
                stock: 300,
                reorderLevel: 30,
                isActive: true,
            },
            {
                name: 'Square Paracetamol',
                sku: 'SQ-PARA-001',
                companyId: createdCompanies[2]._id,
                category: 'Medicine',
                unit: 'box',
                dealerPrice: 200,
                tradePrice: 190,
                stock: 200,
                reorderLevel: 20,
                isActive: true,
            },
        ];
        for (const productData of products) {
            const existing = await productModel.findOne({ sku: productData.sku });
            if (!existing) {
                await productModel.create(productData);
                console.log('✅ Product created:', productData.name);
            }
            else {
                console.log('ℹ️  Product already exists:', productData.name);
            }
        }
        const salesReps = [
            {
                name: 'Rahim Uddin',
                phone: '+8801712345678',
                email: 'rahim@example.com',
                address: 'Dhaka',
                isActive: true,
            },
            {
                name: 'Karim Ahmed',
                phone: '+8801712345679',
                email: 'karim@example.com',
                address: 'Chittagong',
                isActive: true,
            },
            {
                name: 'Fatima Begum',
                phone: '+8801712345680',
                address: 'Sylhet',
                isActive: true,
            },
        ];
        for (const srData of salesReps) {
            const existing = await salesRepModel.findOne({ phone: srData.phone });
            if (!existing) {
                await salesRepModel.create(srData);
                console.log('✅ Sales Rep created:', srData.name);
            }
            else {
                console.log('ℹ️  Sales Rep already exists:', srData.name);
            }
        }
        const customers = [
            {
                name: 'ABC Store',
                code: 'CUST-001',
                phone: '+8801812345678',
                email: 'abc@store.com',
                address: 'Dhaka',
                isActive: true,
            },
            {
                name: 'XYZ Supermarket',
                code: 'CUST-002',
                phone: '+8801812345679',
                address: 'Chittagong',
                isActive: true,
            },
            {
                name: 'City Mart',
                code: 'CUST-003',
                phone: '+8801812345680',
                email: 'city@mart.com',
                address: 'Sylhet',
                isActive: true,
            },
        ];
        for (const customerData of customers) {
            const existing = await customerModel.findOne({ code: customerData.code });
            if (!existing) {
                await customerModel.create(customerData);
                console.log('✅ Customer created:', customerData.name);
            }
            else {
                console.log('ℹ️  Customer already exists:', customerData.name);
            }
        }
        console.log('🎉 Seed completed successfully!');
        console.log('\n📝 Login Credentials:');
        console.log('   Email: admin@dms.com');
        console.log('   Password: admin123');
    }
    catch (error) {
        console.error('❌ Seed failed:', error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed.js.map