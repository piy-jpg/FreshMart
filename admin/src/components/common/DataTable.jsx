import React from 'react';

export const DataTable = ({ columns, data, emptyMessage = 'No records found' }) => {
  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', background: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
        <thead>
          <tr style={{ background: '#0f172a', borderBottom: '1px solid #334155' }}>
            {columns.map((col, idx) => (
              <th key={idx} style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx} style={{ borderBottom: '1px solid #283548' }}>
              {columns.map((col, colIdx) => (
                <td key={colIdx} style={{ padding: '14px 16px', color: '#e2e8f0' }}>
                  {col.render ? col.render(row) : row[col.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
