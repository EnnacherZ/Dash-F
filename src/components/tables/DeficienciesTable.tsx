import { hideInfos } from "@/utils/general";

export const showDeficienciesDesktopTable = (content: any[], t:any, deficiencyOnClick:any, isExpanded:any) => {

  return(<div className="responsive-table">
            <table className="table table-bordered mt-2 orders-table shadow-sm rounded bg-white">
              <thead>
                <tr className="text-muted">
                        <th className="text-muted">{t('order.orderId')} </th>
                        <th className="text-muted">{t('product.type')}</th>
                        <th className="text-muted">{t('product.category')}</th>
                        <th className="text-muted">{t('product.ref')}</th>
                        <th className="text-muted">{t('product.name')}</th>
                        <th className="text-muted">{t('product.size')}</th>
                        <th className="text-muted">{t('admin.deficiency.quantityRequested')}</th>
                        <th className="text-muted">{t('admin.orders.action')}</th>
                </tr>
              </thead>
              <tbody>
                {content.slice(0, isExpanded? content.length: 3).map((ord, index) => (
                  <tr key={index}>
                            <td>{hideInfos(ord.order.order_id, 30)}</td>
                            <td>{ord.product_type}</td>
                            <td>{ord.product_category}</td>
                            <td>{ord.product_ref}</td>
                            <td>{ord.product_name}</td>
                            <td>{ord.product_size}</td>
                            <td>{ord.delta_quantity}</td>
                            <td><button className="btn btn-primary" onClick={()=>{deficiencyOnClick(ord)}}>{t('admin.deficiency.process')} </button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

  )

}

export const showDeficienciesPhoneTable = (content: any[], t:any, deficiencyOnClick:any, isExpanded:any) => {

  return(<div className="d-flex flex-column gap-3 m-1">
            {content.slice(0, isExpanded? content.length: 3).map((ord, index) => (
              <div key={index} className="order-card p-3 shadow-sm rounded bg-white">
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('order.orderId')}:</strong> <p className="fw-bold">{hideInfos(ord.order.order_id, 25)}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('product.type')}:</strong> <p className="fw-bold">{ord.product_type}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('product.category')}:</strong> <p className="fw-bold">{ord.product_category}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('product.ref')}:</strong> <p className="fw-bold">{ord.product_ref}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('product.name')}:</strong> <p className="fw-bold">{ord.product_name}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('product.size')}:</strong> <p className="fw-bold">{ord.product_size}</p>
                </div>
                <div className="my-1 d-flex flex-row justify-content-between">
                  <strong className="text-muted">{t('admin.deficiency.quantityRequested')}:</strong> <p className="fw-bold">{ord.delta_quantity}</p>
                </div>
                <div className="mt-3">
                  <button className="btn btn-primary w-100" onClick={() => deficiencyOnClick(ord)}>
                    {t('admin.deficiency.process')}
                  </button>
                </div>
              </div>
            ))}
          </div>

  )

}
