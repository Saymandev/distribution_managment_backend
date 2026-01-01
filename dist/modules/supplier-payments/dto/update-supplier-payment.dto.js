"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSupplierPaymentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_supplier_payment_dto_1 = require("./create-supplier-payment.dto");
class UpdateSupplierPaymentDto extends (0, mapped_types_1.PartialType)(create_supplier_payment_dto_1.CreateSupplierPaymentDto) {
}
exports.UpdateSupplierPaymentDto = UpdateSupplierPaymentDto;
//# sourceMappingURL=update-supplier-payment.dto.js.map