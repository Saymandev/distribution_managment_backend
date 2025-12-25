"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SRIssuesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const sr_issues_service_1 = require("./sr-issues.service");
const sr_issues_controller_1 = require("./sr-issues.controller");
const sr_issue_schema_1 = require("../../database/schemas/sr-issue.schema");
const product_schema_1 = require("../../database/schemas/product.schema");
const salesrep_schema_1 = require("../../database/schemas/salesrep.schema");
let SRIssuesModule = class SRIssuesModule {
};
exports.SRIssuesModule = SRIssuesModule;
exports.SRIssuesModule = SRIssuesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: sr_issue_schema_1.SRIssue.name, schema: sr_issue_schema_1.SRIssueSchema },
                { name: product_schema_1.Product.name, schema: product_schema_1.ProductSchema },
                { name: salesrep_schema_1.SalesRep.name, schema: salesrep_schema_1.SalesRepSchema },
            ]),
        ],
        controllers: [sr_issues_controller_1.SRIssuesController],
        providers: [sr_issues_service_1.SRIssuesService],
        exports: [sr_issues_service_1.SRIssuesService],
    })
], SRIssuesModule);
//# sourceMappingURL=sr-issues.module.js.map