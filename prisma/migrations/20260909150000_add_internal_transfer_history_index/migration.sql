-- Additive index for project transfer history and cancellation views.
CREATE INDEX "InternalTransfer_userId_status_operationDate_idx"
ON "InternalTransfer"("userId", "status", "operationDate");
