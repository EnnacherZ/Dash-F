import { hideInfos } from "@/utils/general";
import { getDate } from "@/utils/date";
import { FaSpinner, FaTrash } from "react-icons/fa6";
import { DashboardOrder } from "@/server/orders";
import type { TFunction } from "i18next";
import type { ReactNode } from "react";

export const showPhoneTable = (
  content: DashboardOrder[],
  t: TFunction,
  orderStatus: ReactNode[],
  orderExceptions: ReactNode[],
  processOrder: (order: DashboardOrder) => void,
  isExpanded: boolean,
  requestDelete?: (order: DashboardOrder) => void,
  deletingOrderId?: number,
) => {

  return (<div className="d-flex flex-column gap-3 m-1">
            {content.slice(0, isExpanded? content.length: 3).map((ord, index) => (
              <div key={index} className="order-card p-3 shadow-sm rounded bg-white">
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('order.orderId')}:</strong> <p className="fw-bold">{hideInfos(ord.order_id, 30)}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('transaction.transactionId')}:</strong> <p className="fw-bold">{hideInfos(ord.transaction_id, 30)}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('admin.orders.date')}:</strong> <p className="fw-bold">{ord.date}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('transaction.amount')}:</strong> <p className="fw-bold">{ord.amount}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('admin.orders.status')}:</strong> {ord.status ? orderStatus[1] : orderStatus[0]}
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('admin.deficiency.title')}:</strong> {ord.exception ? orderExceptions[0] : orderExceptions[1]}
                </div>
                <div className="mt-3 order-actions order-actions--mobile">
                  <button className="btn btn-primary flex-grow-1" onClick={() => processOrder(ord)}>
                    {t('admin.orders.process')}
                  </button>
                  {requestDelete && (
                    <button
                      type="button"
                      className="btn btn-outline-danger order-delete-btn"
                      onClick={() => requestDelete(ord)}
                      disabled={deletingOrderId === ord.id}
                      aria-label={`${t('admin.orders.delete')} ${ord.order_id}`}
                    >
                      {deletingOrderId === ord.id ? <FaSpinner className="order-delete-spinner"/> : <FaTrash/>}
                      <span>{t('admin.orders.delete')}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
)

}

export const showDesktopTable = (
  content: DashboardOrder[],
  t: TFunction,
  orderStatus: ReactNode[],
  orderExceptions: ReactNode[],
  processOrder: (order: DashboardOrder) => void,
  isExpanded: boolean,
  lang: string = "fr",
  requestDelete?: (order: DashboardOrder) => void,
  deletingOrderId?: number,
) => {

  return (        <div className="responsive-table">
            <table className="table table-bordered mt-2 orders-table shadow-sm rounded bg-white">
              <thead>
                <tr className="text-muted">
                  <th>{t('order.orderId')}</th>
                  <th>{t('transaction.transactionId')}</th>
                  <th>{t('admin.orders.date')}</th>
                  <th>{t('transaction.amount')}</th>
                  <th>{t('admin.orders.status')}</th>
                  <th>{t('admin.deficiency.title')}</th>
                  <th>{t('admin.orders.action')}</th>
                </tr>
              </thead>
              <tbody>
                {content.slice(0, isExpanded? content.length: 3).map((ord, index) => (
                  <tr key={index}>
                    <td className="fw-bold">{hideInfos(ord.order_id, 30)}</td>
                    <td className="fw-bold">{hideInfos(ord.transaction_id, 30)}</td>
                    <td>{ord.date ? getDate(ord.date, "date", lang) : "—"}</td>
                    <td>{ord.amount}</td>
                    <td className="order-status">{ord.status ? orderStatus[1] : orderStatus[0]}</td>
                    <td className="text-center">{ord.exception ? orderExceptions[0] : orderExceptions[1]}</td>
                    <td>
                      <div className="order-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => processOrder(ord)}>
                          {t('admin.orders.process')}
                        </button>
                        {requestDelete && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm order-delete-btn"
                            onClick={() => requestDelete(ord)}
                            disabled={deletingOrderId === ord.id}
                            aria-label={`${t('admin.orders.delete')} ${ord.order_id}`}
                            title={t('admin.orders.delete')}
                          >
                            {deletingOrderId === ord.id ? <FaSpinner className="order-delete-spinner"/> : <FaTrash/>}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
)

}
