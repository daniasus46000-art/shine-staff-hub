import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function AttendanceTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      return data || [];
    },
  });

  const { data: attendance } = useQuery({
    queryKey: ['attendance', date],
    queryFn: async () => {
      const { data } = await supabase.from('attendance').select('*').eq('date', date);
      return data || [];
    },
  });

  const markMutation = useMutation({
    mutationFn: async ({ employeeId, status }: { employeeId: string; status: string }) => {
      const { error } = await supabase.from('attendance').upsert({
        employee_id: employeeId, date, status, marked_by: user!.id,
      }, { onConflict: 'employee_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance', date] });
      toast.success('Attendance updated');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatus = (userId: string) => attendance?.find(a => a.employee_id === userId)?.status;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">Masaroll (Attendance)</h2>
        <div className="flex items-center gap-2">
          <Label>Date:</Label>
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {employees?.map(emp => {
              const status = getStatus(emp.user_id);
              return (
                <TableRow key={emp.user_id}>
                  <TableCell className="font-medium">{emp.full_name}</TableCell>
                  <TableCell>
                    {status ? (
                      <Badge variant={status === 'present' ? 'default' : 'destructive'} className="capitalize">
                        {status}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">Not marked</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant={status === 'present' ? 'default' : 'outline'}
                        onClick={() => markMutation.mutate({ employeeId: emp.user_id, status: 'present' })}>
                        Present
                      </Button>
                      <Button size="sm" variant={status === 'absent' ? 'destructive' : 'outline'}
                        onClick={() => markMutation.mutate({ employeeId: emp.user_id, status: 'absent' })}>
                        Absent
                      </Button>
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
