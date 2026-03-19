import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export default function MyAttendanceTab() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const startDate = `${month}-01`;
  const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).toISOString().split('T')[0];

  const { data: attendance } = useQuery({
    queryKey: ['my-attendance', month],
    queryFn: async () => {
      const { data } = await supabase.from('attendance').select('*').eq('employee_id', user!.id).gte('date', startDate).lte('date', endDate).order('date');
      return data || [];
    },
  });

  const present = attendance?.filter(a => a.status === 'present').length || 0;
  const absent = attendance?.filter(a => a.status === 'absent').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">My Attendance</h2>
        <div className="flex items-center gap-2">
          <Label>Month:</Label>
          <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-auto" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Present</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold text-success">{present}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Absent</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-heading font-bold text-destructive">{absent}</p></CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendance?.map(a => (
              <TableRow key={a.id}>
                <TableCell>{a.date}</TableCell>
                <TableCell>
                  <Badge variant={a.status === 'present' ? 'default' : 'destructive'} className="capitalize">{a.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
            {!attendance?.length && (
              <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-8">No attendance records</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
