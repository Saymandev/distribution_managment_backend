"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSalesRepDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_salesrep_dto_1 = require("./create-salesrep.dto");
class UpdateSalesRepDto extends (0, mapped_types_1.PartialType)(create_salesrep_dto_1.CreateSalesRepDto) {
}
exports.UpdateSalesRepDto = UpdateSalesRepDto;
//# sourceMappingURL=update-salesrep.dto.js.map