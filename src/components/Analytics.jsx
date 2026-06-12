import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";

import { formatCurrency, formatCompactCurrency } from "../helpers";

const Analytics = ({ budgets, expenses }) => {
  // total budget
  const totalBudget = budgets.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0,
  );

  // total spent
  const totalSpent = expenses.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0,
  );

  // remaining balance
  const remaining = totalBudget - totalSpent;

  // top category
  const topCategory = budgets.reduce(
    (prev, current) => (prev.spent > current.spent ? prev : current),
    budgets[0] || {},
  );

  // active budgets
  const activeBudgets = budgets.filter((budget) => budget.spent > 0);

  // current date
  const now = new Date();

  const currentMonth = now.getMonth();

  const currentYear = now.getFullYear();

  // this month expenses
  const thisMonthExpenses = expenses.filter((expense) => {
    const date = new Date(expense.createdAt);

    return (
      date.getMonth() === currentMonth && date.getFullYear() === currentYear
    );
  });

  // this month total
  const thisMonthTotal = thisMonthExpenses.reduce(
    (acc, curr) => acc + Number(curr.amount),
    0,
  );

  // pie chart data
  const pieData = activeBudgets.map((budget) => ({
    name:
      budget.name.length > 14 ? budget.name.slice(0, 14) + "…" : budget.name,

    value: budget.spent,

    color: `hsl(${budget.color})`,
  }));

  // bar chart data
  const monthlyData = activeBudgets.map((budget) => ({
    name:
      budget.name.length > 8 ? budget.name.slice(0, 8) + "…" : budget.name,

    spent: budget.spent,

    fill: `hsl(${budget.color})`,
  }));

  return (
    <div className="analytics">
      {/* analytics cards */}
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>Total Budget</h4>

          <h2>{formatCompactCurrency(totalBudget)}</h2>
        </div>

        <div className="analytics-card">
          <h4>Total Spent</h4>

          <h2>{formatCompactCurrency(totalSpent)}</h2>
        </div>

        <div className="analytics-card">
          <h4>Remaining</h4>

          <h2
            style={{
              color: remaining < 0 ? "#ef4444" : "#22c55e",
            }}
          >
            {formatCompactCurrency(remaining)}
          </h2>
        </div>

        <div className="analytics-card">
          <h4>Most Spent</h4>

          <h2 title={topCategory?.name}>
            {topCategory?.name
              ? topCategory.name.length > 12
                ? `${topCategory.name.slice(0, 12)}...`
                : topCategory.name
              : "None"}
          </h2>

          <small>{formatCompactCurrency(topCategory?.spent || 0)}</small>
        </div>

        <div className="analytics-card">
          <h4>This Month</h4>

          <h2>{formatCompactCurrency(thisMonthTotal)}</h2>
        </div>
      </div>

      {/* charts */}
      <div className="analytics-chart-grid">
        {/* pie chart */}
        <div className="chart-card">
          <h3>Spending Overview</h3>

          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={390}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={95}
                  outerRadius={130}
                  paddingAngle={3}
                  cornerRadius={10}
                  stroke="none"
                  animationDuration={1400}
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.color}
                      style={{
                        filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.12))",
                      }}
                    />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="48%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: "2rem",
                    fontWeight: 800,
                    fill: "#111827",
                  }}
                >
                  {formatCompactCurrency(totalSpent)}
                </text>

                <text
                  x="50%"
                  y="58%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontSize: "0.9rem",
                    fill: "#6b7280",
                    fontWeight: 600,
                  }}
                >
                  Total Spent
                </text>
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "18px",
                    border: "none",
                    background: "rgba(255,255,255,0.96)",
                    backdropFilter: "blur(14px)",
                    boxShadow: "0 12px 35px rgba(0,0,0,0.14)",
                    padding: "12px 16px",
                  }}
                  cursor={{ fill: "rgba(0,0,0,0.03)" }}
                />

                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "1rem",

                    fontWeight: 600,

                    fontSize: "0.9rem",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "360px",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                opacity: 0.6,

                fontWeight: 600,
              }}
            >
              No expense data yet
            </div>
          )}
        </div>

        {/* bar chart */}
        <div className="chart-card">
          <h3>Budget Spending</h3>

          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={390}>
              <BarChart
                data={monthlyData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 0,
                  bottom: 10,
                }}
                barCategoryGap="35%"
              >
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  opacity={0.08}
                />

                <XAxis
                  dataKey="name"
                  tick={{
                    fill: "#6b7280",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  tickFormatter={(value) => formatCompactCurrency(value)}
                  tick={{
                    fill: "#6b7280",
                    fontSize: 13,
                  }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: "1rem",

                    border: "none",

                    boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                  }}
                />

                <Bar
                  dataKey="spent"
                  radius={[18, 18, 0, 0]}
                  animationDuration={1400}
                  maxBarSize={65}
                >
                  {monthlyData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.fill}
                      style={{
                        filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.12))",
                      }}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div
              style={{
                height: "360px",

                display: "flex",

                alignItems: "center",

                justifyContent: "center",

                opacity: 0.6,

                fontWeight: 600,
              }}
            >
              No spending data yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
