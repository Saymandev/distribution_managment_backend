import { PartialType } from "@nestjs/mapped-types";
import { CreateSupplierReceiptDto } from "./create-supplier-receipt.dto";

export class UpdateSupplierReceiptDto extends PartialType(
  CreateSupplierReceiptDto,
) {}
