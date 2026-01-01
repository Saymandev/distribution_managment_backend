"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const company_claim_schema_1 = require("../../database/schemas/company-claim.schema");
const customer_schema_1 = require("../../database/schemas/customer.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const sr_payment_schema_1 = require("../../database/schemas/sr-payment.schema");
let CustomersService = class CustomersService {
    constructor(customerModel, srPaymentModel, companyClaimModel, productModel) {
        this.customerModel = customerModel;
        this.srPaymentModel = srPaymentModel;
        this.companyClaimModel = companyClaimModel;
        this.productModel = productModel;
    }
    async create(dto) {
        var _a;
        const existing = await this.customerModel
            .findOne({ code: dto.code })
            .exec();
        if (existing) {
            throw new common_1.ConflictException("Customer with this code already exists");
        }
        const created = new this.customerModel(Object.assign(Object.assign({}, dto), { isActive: (_a = dto.isActive) !== null && _a !== void 0 ? _a : true }));
        return created.save();
    }
    async findAll() {
        return this.customerModel.find().sort({ name: 1 }).exec();
    }
    async findOne(id) {
        const customer = await this.customerModel.findById(id).exec();
        if (!customer) {
            throw new common_1.NotFoundException("Customer not found");
        }
        return customer;
    }
    async update(id, dto) {
        if (dto.code) {
            const existing = await this.customerModel
                .findOne({ code: dto.code, _id: { $ne: id } })
                .exec();
            if (existing) {
                throw new common_1.ConflictException("Customer with this code already exists");
            }
        }
        const updated = await this.customerModel
            .findByIdAndUpdate(id, { $set: dto }, { new: true })
            .exec();
        if (!updated) {
            throw new common_1.NotFoundException("Customer not found");
        }
        return updated;
    }
    async remove(id) {
        const res = await this.customerModel.findByIdAndDelete(id).exec();
        if (!res) {
            throw new common_1.NotFoundException("Customer not found");
        }
    }
    async getCustomerSummaries(companyId, page = 1, limit = 10, searchQuery = "", startDate, endDate) {
        console.log("🔍 Getting customer summaries:", {
            companyId,
            page,
            limit,
            searchQuery,
            startDate: startDate === null || startDate === void 0 ? void 0 : startDate.toISOString(),
            endDate: endDate === null || endDate === void 0 ? void 0 : endDate.toISOString(),
        });
        console.log(`🔍 Using companyId: ${companyId}`);
        const paymentMatch = {};
        console.log(`📅 TEMP: Skipping date filtering for debugging`);
        if (companyId) {
            console.log(`🏢 Customers service - filtering by company: ${companyId}`);
            console.log(`🏢 Looking for products with companyId: ${companyId} (type: ${typeof companyId})`);
            const companyProducts = await this.productModel
                .find({
                $or: [
                    { companyId: new mongoose_2.Types.ObjectId(companyId) },
                    { companyId: companyId },
                    { "companyId._id": companyId },
                ],
            })
                .select("_id name")
                .exec();
            console.log(`🏢 Found ${companyProducts.length} products for company ${companyId}:`, companyProducts.map((p) => ({ id: p._id, name: p.name })));
            const productIds = companyProducts.map((p) => p._id.toString());
            console.log(`🏢 Product IDs:`, productIds);
            if (productIds.length > 0) {
                paymentMatch["items.productId"] = { $in: productIds };
                console.log(`🏢 Filtering customer summaries by company ${companyId}, applying filter: ${JSON.stringify(paymentMatch)}`);
            }
            else {
                console.log(`🏢 No products found for company ${companyId}, returning empty customer summaries`);
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
        }
        else {
            console.log(`🌍 Showing all customers across all companies`);
        }
        console.log(`🔍 Customers service - paymentMatch:`, JSON.stringify(paymentMatch));
        let payments = await this.srPaymentModel
            .find(paymentMatch)
            .sort({ paymentDate: -1 })
            .exec();
        console.log(`🔍 Customers service - found ${payments.length} payments total`);
        payments = payments.filter((payment) => { var _a; return (_a = payment.customerInfo) === null || _a === void 0 ? void 0 : _a.name; });
        console.log(`🔍 Customers service - found ${payments.length} payments with customer info`);
        const customerMap = new Map();
        payments.forEach((payment) => {
            var _a;
            if (!((_a = payment.customerInfo) === null || _a === void 0 ? void 0 : _a.name))
                return;
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
            const customer = customerMap.get(customerKey);
            customer.totalPaid += payment.receivedAmount || 0;
            customer.totalDue += payment.customerDue || 0;
            customer.totalDiscounts += payment.companyClaim || 0;
            customer.paymentCount += 1;
            if (new Date(payment.paymentDate) > new Date(customer.lastPaymentDate)) {
                customer.lastPaymentDate = payment.paymentDate;
            }
            customer.payments.push(payment);
        });
        let customers = Array.from(customerMap.values());
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            customers = customers.filter((customer) => customer.name.toLowerCase().includes(query) ||
                customer.phone.includes(query) ||
                (customer.address && customer.address.toLowerCase().includes(query)));
        }
        customers.sort((a, b) => b.totalPaid - a.totalPaid);
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
    async searchCustomers(query, limit = 5) {
        console.log("🔍 Searching customers:", { query, limit });
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
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(customer_schema_1.Customer.name)),
    __param(1, (0, mongoose_1.InjectModel)(sr_payment_schema_1.SRPayment.name)),
    __param(2, (0, mongoose_1.InjectModel)(company_claim_schema_1.CompanyClaim.name)),
    __param(3, (0, mongoose_1.InjectModel)(product_schema_1.Product.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model,
        mongoose_2.Model])
], CustomersService);
//# sourceMappingURL=customers.service.js.map