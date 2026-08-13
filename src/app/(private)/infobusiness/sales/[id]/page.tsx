import Link from "next/link";

import { DeleteInfoBusinessRecordForm } from "@/components/delete-infobusiness-record-form";
import { InfoSaleForm } from "@/components/infobusiness-sale-form";
import { dateToInput } from "@/lib/dates";
import { requireUser } from "@/server/auth";
import { getInfoDashboard, getInfoSale } from "@/server/infobusiness";
import { deleteInfoSaleAction, updateInfoSaleAction } from "../../actions";

export default async function InfoSalePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser(); const { id } = await params; const [sale, dashboard] = await Promise.all([getInfoSale(user.id, id), getInfoDashboard(user.id)]);
  return <><header className="page-header"><div><p className="eyebrow">Инфобизнес · Продажа</p><h1>Редактировать продажу</h1></div><Link href="/infobusiness/sales" className="text-link">К продажам</Link></header><InfoSaleForm products={dashboard.products.filter((product) => product.status !== "ARCHIVED" || product.id === sale.productId).map((product) => ({ id: product.id, name: product.name, basePrice: product.basePrice?.toString() ?? null }))} action={updateInfoSaleAction} initialValues={{ id: sale.id, productId: sale.productId, amount: sale.incomeTransaction.amount.toString(), operationDate: dateToInput(sale.incomeTransaction.operationDate), buyer: sale.buyer ?? "", buyerPhone: sale.buyerPhone ?? "", buyerEmail: sale.buyerEmail ?? "", instagramUrl: sale.instagramUrl ?? "", seats: sale.seats, comment: sale.comment ?? "" }}/><div className="danger-zone"><h2>Удаление</h2><p>Связанный Income также будет исключён из отчётов.</p><DeleteInfoBusinessRecordForm id={sale.id} action={deleteInfoSaleAction} kind="sale"/></div></>;
}
