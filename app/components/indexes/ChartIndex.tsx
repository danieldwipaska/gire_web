'use client';

import { mockActivityData } from '@/mocks/data.mock';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ListContainer from '../Lists/ListContainer';

const ChartIndex = () => {
  return (
    <>
      <ListContainer title="Weekly Activity">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockActivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="date" stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
            <YAxis stroke="rgba(255,255,255,0.6)" tick={{ fill: 'rgba(255,255,255,0.6)' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                backdropFilter: 'blur(10px)',
              }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: 'rgba(255, 255, 255, 0.8)' }}
            />
            <Legend wrapperStyle={{ color: 'rgba(255, 255, 255, 0.8)' }} />
            <Line type="monotone" dataKey="prs" stroke="#a855f7" strokeWidth={3} name="PRs Created" dot={{ fill: '#a855f7', r: 5 }} activeDot={{ r: 7 }} />
            <Line type="monotone" dataKey="reviews" stroke="#ec4899" strokeWidth={3} name="Reviews" dot={{ fill: '#ec4899', r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </ListContainer>
    </>
  );
};

export default ChartIndex;
