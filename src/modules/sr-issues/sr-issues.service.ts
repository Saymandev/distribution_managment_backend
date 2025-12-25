import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from '../../database/schemas/product.schema';
import { SalesRep, SalesRepDocument } from '../../database/schemas/salesrep.schema';
import { SRIssue, SRIssueDocument } from '../../database/schemas/sr-issue.schema';
import { CreateSRIssueDto } from './dto/create-sr-issue.dto';

@Injectable()
export class SRIssuesService {
  constructor(
    @InjectModel(SRIssue.name) private readonly srIssueModel: Model<SRIssueDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectModel(SalesRep.name) private readonly salesRepModel: Model<SalesRepDocument>,
  ) {}

  async generateIssueNumber(): Promise<string> {
    const lastIssue = await this.srIssueModel
      .findOne()
      .sort({ createdAt: -1 })
      .exec();
    
    if (!lastIssue || !lastIssue.issueNumber) {
      return 'ISSUE-001';
    }

    const match = lastIssue.issueNumber.match(/ISSUE-(\d+)/);
    if (!match) {
      return 'ISSUE-001';
    }

    const lastNumber = parseInt(match[1] || '0');
    const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
    return `ISSUE-${nextNumber}`;
  }

  async create(dto: CreateSRIssueDto): Promise<SRIssue> {
    // Auto-generate issue number if not provided
    let issueNumber = dto.issueNumber;
    if (!issueNumber) {
      issueNumber = await this.generateIssueNumber();
    }

    // Check if issue number exists
    const existing = await this.srIssueModel.findOne({ issueNumber }).exec();
    if (existing) {
      throw new ConflictException('Issue number already exists');
    }

    // Verify SR exists
    const sr = await this.salesRepModel.findById(dto.srId).exec();
    if (!sr) {
      throw new NotFoundException('Sales Rep not found');
    }

    // Calculate total amount and verify stock
    // First, check all products exist and calculate total quantities per product
    // (in case same product is added multiple times)
    const productQuantities = new Map<string, number>();
    const productMap = new Map<string, ProductDocument>();
    
    for (const item of dto.items) {
      const product = await this.productModel.findById(item.productId).exec();
      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }
      
      // Sum quantities if same product appears multiple times
      const currentQty = productQuantities.get(item.productId) || 0;
      productQuantities.set(item.productId, currentQty + item.quantity);
      productMap.set(item.productId, product);
    }
    
    // Now validate stock for each product (checking total quantity)
    for (const [productId, totalQuantity] of productQuantities.entries()) {
      const product = productMap.get(productId);
      if (!product) {
        throw new NotFoundException(`Product ${productId} not found`);
      }
      
      if (product.stock < totalQuantity) {
        throw new ConflictException(
          `Insufficient stock for product ${product.name}. Available: ${product.stock}, Required: ${totalQuantity}`
        );
      }
    }
    
    // Calculate total amount
    let totalAmount = 0;
    for (const item of dto.items) {
      totalAmount += item.quantity * item.dealerPrice;
    }

    // Create issue
    const issue = new this.srIssueModel({
      ...dto,
      issueNumber,
      totalAmount,
      issueDate: new Date(),
    });

    // Reduce stock for each product
    for (const item of dto.items) {
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      }).exec();
    }

    return issue.save();
  }

  async findAll(): Promise<SRIssue[]> {
    return this.srIssueModel
      .find()
      .populate('srId', 'name phone')
      .populate('items.productId', 'name sku')
      .sort({ issueDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<SRIssue> {
    const issue = await this.srIssueModel
      .findById(id)
      .populate('srId')
      .populate('items.productId')
      .exec();
    if (!issue) {
      throw new NotFoundException('SR Issue not found');
    }
    return issue;
  }

  async findBySR(srId: string): Promise<SRIssue[]> {
    return this.srIssueModel
      .find({ srId })
      .populate('items.productId', 'name sku')
      .sort({ issueDate: -1 })
      .exec();
  }
}

