import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { Company, CompanyDocument } from './schemas/company.schema';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { Product, ProductDocument } from './schemas/product.schema';
import { SalesRep, SalesRepDocument } from './schemas/salesrep.schema';
import { User, UserDocument } from './schemas/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
  const companyModel = app.get<Model<CompanyDocument>>(getModelToken(Company.name));
  const productModel = app.get<Model<ProductDocument>>(getModelToken(Product.name));
  const salesRepModel = app.get<Model<SalesRepDocument>>(getModelToken(SalesRep.name));
  const customerModel = app.get<Model<CustomerDocument>>(getModelToken(Customer.name));

  try {
    console.log('🌱 Starting seed...');

    // Clear existing data (optional - comment out if you want to keep existing data)
    // await userModel.deleteMany({});
    // await companyModel.deleteMany({});
    // await productModel.deleteMany({});
    // await salesRepModel.deleteMany({});
    // await customerModel.deleteMany({});

    // 1. Create Admin User
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
    } else {
      // Update password to ensure it's correct
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await userModel.updateOne(
        { email: 'admin@dms.com' },
        { password: hashedPassword, isActive: true }
      );
      console.log('✅ Admin user password updated');
    }

    // 2. Create Companies (Suppliers)
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
      } else {
        createdCompanies.push(existing);
        console.log('ℹ️  Company already exists:', companyData.name);
      }
    }

    // 3. Create Products
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
      } else {
        console.log('ℹ️  Product already exists:', productData.name);
      }
    }

    // 4. Create Sales Reps
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
      } else {
        console.log('ℹ️  Sales Rep already exists:', srData.name);
      }
    }

    // 5. Create Customers
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
      } else {
        console.log('ℹ️  Customer already exists:', customerData.name);
      }
    }

    console.log('🎉 Seed completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: admin@dms.com');
    console.log('   Password: admin123');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();

