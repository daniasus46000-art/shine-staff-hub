import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function MyRemarksTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState('');

  const { data: remarks } = useQuery({
    queryKey: ['my-remarks'],
    queryFn: async () => {
      const { data } = await supabase.from('remarks').select('*').eq('employee_id', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('remarks').insert({ employee_id: user!.id, date, reason });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-remarks'] });
      toast.success('Remark submitted');
      setReason('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-heading font-semibold">Submit Remark / Leave Reason</h2>

      <Card>
        <CardHeader><CardTitle className="text-base">New Remark</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-auto" />
          </div>
          <div className="space-y-2">
            <Label>Reason / Note</Label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Enter your leave reason or note..." />
          </div>
          <Button onClick={() => submitMutation.mutate()} disabled={!reason}>Submit</Button>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Admin Remark</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {remarks?.map(r => (
              <TableRow key={r.id}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.reason}</TableCell>
                <TableCell>{r.admin_remark || <span className="text-muted-foreground">—</span>}</TableCell>
              </TableRow>
            ))}
            {!remarks?.length && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No remarks submitted</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
