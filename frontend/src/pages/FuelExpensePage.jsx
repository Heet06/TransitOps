import { DashboardFrame, PanelCard } from '../components/PageFrame.jsx'
import { fuelRows, expenseRows } from '../data/transitopsData.js'

export default function FuelExpensePage({ currentUser, activePage, visiblePages, onNavigate, onLogout }) {
  return (
    <DashboardFrame currentUser={currentUser} activePage={activePage} visiblePages={visiblePages} onNavigate={onNavigate} onLogout={onLogout}>
      <section className="module-section">
        <div className="container-wide">
          <div className="page-title-row">
            <div>
              <span className="badge-soft">Fuel & Expense Management</span>
              <h2>Track spend and reconcile usage</h2>
            </div>
            <button type="button" className="btn btn-primary rounded-pill">Add Expense</button>
          </div>

          <div className="module-grid">
            <PanelCard>
              <div className="panel-heading"><span>Expense entry</span></div>
              <form className="stacked-form">
                <select defaultValue="">
                  <option value="" disabled>Vehicle</option>
                  <option>Van-05</option>
                  <option>Bus-18</option>
                  <option>Truck-09</option>
                </select>
                <input type="text" placeholder="Fuel or expense type" />
                <input type="text" placeholder="Quantity / Amount" />
                <input type="text" placeholder="Reference number" />
                <button type="button" className="btn btn-primary rounded-pill">Save Expense</button>
              </form>
            </PanelCard>

            <PanelCard className="wide">
              <div className="panel-heading"><span>Fuel log</span></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Fuel</th>
                      <th>Rate</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelRows.map((row) => (
                      <tr key={`${row.vehicle}-${row.total}`}>
                        <td>{row.vehicle}</td>
                        <td>{row.fuel}</td>
                        <td>{row.rate}</td>
                        <td>{row.total}</td>
                        <td>{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>

            <PanelCard className="wide">
              <div className="panel-heading"><span>Expense summary</span></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Fuel</th>
                      <th>Maintenance</th>
                      <th>Total</th>
                      <th>ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseRows.map((row) => (
                      <tr key={row.vehicle}>
                        <td>{row.vehicle}</td>
                        <td>{row.fuel}</td>
                        <td>{row.maintenance}</td>
                        <td>{row.total}</td>
                        <td>{row.roi}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelCard>
          </div>
        </div>
      </section>
    </DashboardFrame>
  )
}