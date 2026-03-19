import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PlannerTab() {
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);

  const startDate = `${month}-01`;
  const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).toISOString().split('T')[0];

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      return data || [];
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ['planner', month],
    queryFn: async () => {
      const { data } = await supabase.from('planner').select('*').gte('date', startDate).lte('date', endDate);
      return data || [];
    },
  });

  const getEmployeeSchedules = (userId: string) => schedules?.filter(s => s.employee_id === userId) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">Work Planner</h2>
        <div className="flex items-center gap-2">
          <Label>Month:</Label>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-auto" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Scheduled Days</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Shifts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map(emp => {
              const empSchedules = getEmployeeSchedules(emp.user_id);
              const dayCount = empSchedules.length;
              const meetsMin = dayCount >= 15;
              return (
                <TableRow key={emp.user_id}>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell>{dayCount} days</TableCell>
                  <TableCell>
                    <Badge variant={meetsMin ? 'default' : 'destructive'}>
                      {meetsMin ? 'Met (15+)' : `${dayCount}/15 — Below minimum`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {empSchedules.slice(0, 5).map(s => (
                        <Badge key={s.id} variant="outline" className="text-xs capitalize">
                          {s.date.slice(5)} · {s.shift}
                        </Badge>
                      ))}
                      {empSchedules.length > 5 && (
                        <Badge variant="outline" className="text-xs">+{empSchedules.length - 5} more</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
