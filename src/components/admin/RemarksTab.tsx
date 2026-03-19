import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export default function RemarksTab() {
  const qc = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminRemark, setAdminRemark] = useState('');

  const { data: remarks } = useQuery({
    queryKey: ['remarks'],
    queryFn: async () => {
      const { data } = await supabase.from('remarks').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, remark }: { id: string; remark: string }) => {
      const { error } = await supabase.from('remarks').update({ admin_remark: remark }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['remarks'] });
      toast.success('Remark updated');
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getName = (userId: string) => employees?.find(e => e.user_id === userId)?.full_name || userId;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-heading font-semibold">Remarks & Leave Reasons</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Admin Remark</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {remarks?.map(r => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{getName(r.employee_id)}</TableCell>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.reason}</TableCell>
                <TableCell>
                  {editingId === r.id ? (
                    <Input value={adminRemark} onChange={e => setAdminRemark(e.target.value)} className="w-48" />
                  ) : (
                    r.admin_remark || <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === r.id ? (
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: r.id, remark: adminRemark })}>Save</Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(r.id); setAdminRemark(r.admin_remark || ''); }}>
                      Add Remark
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!remarks?.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No remarks yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
