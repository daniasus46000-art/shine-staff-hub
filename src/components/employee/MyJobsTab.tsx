import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', icon: AlertCircle, color: 'text-muted-foreground' },
  { value: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-yellow-600' },
  { value: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-green-600' },
];

export default function MyJobsTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [updateFor, setUpdateFor] = useState<string | null>(null);
  const [updateText, setUpdateText] = useState('');
  const [updateStatus, setUpdateStatus] = useState('in_progress');

  const { data: jobs } = useQuery({
    queryKey: ['my-jobs'],
    queryFn: async () => {
      const { data } = await supabase.from('announcements').select('*').eq('assigned_to', user!.id).order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: myFeedback } = useQuery({
    queryKey: ['my-feedback'],
    queryFn: async () => {
      const { data } = await supabase.from('feedback').select('*').eq('employee_id', user!.id);
      return data || [];
    },
  });

  const { data: myUpdates } = useQuery({
    queryKey: ['my-work-updates'],
    queryFn: async () => {
      const { data } = await supabase.from('work_updates').select('*').eq('employee_id', user!.id).order('created_at', { ascending: false });
      return (data as any[]) || [];
    },
  });

  const submitFeedback = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('feedback').insert({
        employee_id: user!.id, announcement_id: feedbackFor!, feedback_text: feedbackText, status: 'completed',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-feedback'] });
      toast.success('Feedback submitted');
      setFeedbackFor(null); setFeedbackText('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const submitUpdate = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('work_updates').insert({
        employee_id: user!.id,
        announcement_id: updateFor!,
        update_text: updateText,
        status: updateStatus,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-work-updates'] });
      toast.success('Status update posted');
      setUpdateFor(null); setUpdateText(''); setUpdateStatus('in_progress');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const hasFeedback = (jobId: string) => myFeedback?.some(f => f.announcement_id === jobId);
  const getJobUpdates = (jobId: string) => myUpdates?.filter((u: any) => u.announcement_id === jobId) || [];
  const getLatestStatus = (jobId: string) => {
    const updates = getJobUpdates(jobId);
    return updates.length > 0 ? updates[0].status : 'not_started';
  };

  const statusBadge = (status: string) => {
    const opt = STATUS_OPTIONS.find(s => s.value === status);
    if (!opt) return null;
    const Icon = opt.icon;
    return (
      <Badge variant="outline" className="gap-1">
        <Icon className={`h-3 w-3 ${opt.color}`} />
        {opt.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-heading font-semibold">My Assigned Jobs</h2>
      {jobs?.map(job => {
        const latestStatus = getLatestStatus(job.id);
        const jobUpdates = getJobUpdates(job.id);

        return (
          <Card key={job.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base">{job.title}</CardTitle>
                <div className="flex items-center gap-2">
                  {statusBadge(latestStatus)}
                  {job.deadline && <Badge variant="outline">Due: {job.deadline}</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {job.description && <p className="text-sm text-muted-foreground">{job.description}</p>}

              {/* Status Updates Section */}
              <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status Updates</span>
                  {updateFor !== job.id && (
                    <Button size="sm" variant="outline" onClick={() => setUpdateFor(job.id)} className="gap-1">
                      <Send className="h-3 w-3" /> Post Update
                    </Button>
                  )}
                </div>

                {updateFor === job.id && (
                  <div className="space-y-2 border-t pt-2">
                    <Select value={updateStatus} onValueChange={setUpdateStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map(s => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Textarea value={updateText} onChange={e => setUpdateText(e.target.value)} placeholder="Describe your progress..." />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => submitUpdate.mutate()} disabled={!updateText}>Post</Button>
                      <Button size="sm" variant="outline" onClick={() => { setUpdateFor(null); setUpdateText(''); }}>Cancel</Button>
                    </div>
                  </div>
                )}

                {jobUpdates.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {jobUpdates.map((u: any) => (
                      <div key={u.id} className="text-sm border-l-2 border-primary/30 pl-3 py-1">
                        <div className="flex items-center gap-2">
                          {statusBadge(u.status)}
                          <span className="text-xs text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="mt-1 text-muted-foreground">{u.update_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No updates yet</p>
                )}
              </div>

              {/* Feedback Section */}
              {hasFeedback(job.id) ? (
                <Badge variant="default">Feedback Submitted</Badge>
              ) : feedbackFor === job.id ? (
                <div className="space-y-2">
                  <Textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Write your feedback..." />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => submitFeedback.mutate()} disabled={!feedbackText}>Submit Feedback</Button>
                    <Button size="sm" variant="outline" onClick={() => setFeedbackFor(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setFeedbackFor(job.id)}>Submit Feedback</Button>
              )}
            </CardContent>
          </Card>
        );
      })}
      {!jobs?.length && <p className="text-muted-foreground text-center py-8">No jobs assigned yet.</p>}
    </div>
  );
}
