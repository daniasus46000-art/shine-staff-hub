import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function ReportsTab() {
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

  const { data: attendance } = useQuery({
    queryKey: ['report-attendance', month],
    queryFn: async () => {
      const { data } = await supabase.from('attendance').select('*').gte('date', startDate).lte('date', endDate);
      return data || [];
    },
  });

  const { data: schedules } = useQuery({
    queryKey: ['report-planner', month],
    queryFn: async () => {
      const { data } = await supabase.from('planner').select('*').gte('date', startDate).lte('date', endDate);
      return data || [];
    },
  });

  const { data: feedback } = useQuery({
    queryKey: ['report-feedback', month],
    queryFn: async () => {
      const { data } = await supabase.from('feedback').select('*').gte('created_at', startDate).lte('created_at', endDate + 'T23:59:59');
      return data || [];
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">Monthly Report</h2>
        <div className="flex items-center gap-2">
          <Label>Month:</Label>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-auto" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Employees</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold">{employees?.length || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Attendance Records</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold">{attendance?.length || 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Submissions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold">{feedback?.length || 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Employee Summary</CardTitle></CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Present Days</TableHead>
              <TableHead>Absent Days</TableHead>
              <TableHead>Scheduled Days</TableHead>
              <TableHead>Min 15 Met</TableHead>
              <TableHead>Submissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map(emp => {
              const empAtt = attendance?.filter(a => a.employee_id === emp.user_id) || [];
              const present = empAtt.filter(a => a.status === 'present').length;
              const absent = empAtt.filter(a => a.status === 'absent').length;
              const scheduled = schedules?.filter(s => s.employee_id === emp.user_id).length || 0;
              const subs = feedback?.filter(f => f.employee_id === emp.user_id).length || 0;
              return (
                <TableRow key={emp.user_id}>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell>{present}</TableCell>
                  <TableCell>{absent}</TableCell>
                  <TableCell>{scheduled}</TableCell>
                  <TableCell>
                    <Badge variant={scheduled >= 15 ? 'default' : 'destructive'}>
                      {scheduled >= 15 ? 'Yes' : 'No'}
                    </Badge>
                  </TableCell>
                  <TableCell>{subs}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
