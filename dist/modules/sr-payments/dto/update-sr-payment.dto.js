"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSRPaymentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_sr_payment_dto_1 = require("./create-sr-payment.dto");
class UpdateSRPaymentDto extends (0, mapped_types_1.PartialType)(create_sr_payment_dto_1.CreateSRPaymentDto) {
}
exports.UpdateSRPaymentDto = UpdateSRPaymentDto;
//# sourceMappingURL=update-sr-payment.dto.js.map