import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SubmissionsTab() {
  const qc = useQueryClient();

  const { data: feedback } = useQuery({
    queryKey: ['feedback'],
    queryFn: async () => {
      const { data } = await supabase.from('feedback').select('*, announcements(title)').order('created_at', { ascending: false });
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

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('feedback').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback'] });
      toast.success('Status updated');
    },
  });

  const getName = (userId: string) => employees?.find(e => e.user_id === userId)?.full_name || userId;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-heading font-semibold">Employee Submissions</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Job</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {feedback?.map((f: any) => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{getName(f.employee_id)}</TableCell>
                <TableCell>{f.announcements?.title || '—'}</TableCell>
                <TableCell className="max-w-xs truncate">{f.feedback_text}</TableCell>
                <TableCell>
                  <Badge variant={f.status === 'completed' ? 'default' : 'secondary'} className="capitalize">{f.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline"
                    onClick={() => updateStatus.mutate({ id: f.id, status: f.status === 'completed' ? 'pending' : 'completed' })}>
                    Mark {f.status === 'completed' ? 'Pending' : 'Complete'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!feedback?.length && (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
