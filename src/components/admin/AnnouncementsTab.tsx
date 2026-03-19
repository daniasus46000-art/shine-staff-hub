import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function AnnouncementsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [deadline, setDeadline] = useState('');

  const { data: employees } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name, email');
      return data || [];
    },
  });

  const { data: announcements } = useQuery({
    queryKey: ['announcements'],
    queryFn: async () => {
      const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('announcements').insert({
        title, description, assigned_to: assignedTo, deadline: deadline || null, created_by: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['announcements'] });
      toast.success('Job assigned successfully');
      setShowForm(false);
      setTitle(''); setDescription(''); setAssignedTo(''); setDeadline('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const getEmployeeName = (userId: string) => employees?.find(e => e.user_id === userId)?.full_name || userId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-heading font-semibold">Job Assignments</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Assign Job
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Job Assignment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Job Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter job title" />
              </div>
              <div className="space-y-2">
                <Label>Assign To</Label>
                <Select value={assignedTo} onValueChange={setAssignedTo}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees?.map(e => (
                      <SelectItem key={e.user_id} value={e.user_id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Job description..." />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
            </div>
            <Button onClick={() => createMutation.mutate()} disabled={!title || !assignedTo}>
              Save Assignment
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {announcements?.map(a => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{a.title}</TableCell>
                <TableCell>{getEmployeeName(a.assigned_to)}</TableCell>
                <TableCell>{a.deadline || '—'}</TableCell>
                <TableCell>{new Date(a.created_at).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
            {!announcements?.length && (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No assignments yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
