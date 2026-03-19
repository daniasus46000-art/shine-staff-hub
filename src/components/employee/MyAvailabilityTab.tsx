import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

const MORNING_SLOTS = ['9–1', '11–3', '2–6', '3–7'];
const EVENING_SLOTS = ['2–6', '5–9', '6–10'];

export default function MyAvailabilityTab() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  const [date, setDate] = useState('');
  const [shift, setShift] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  const startDate = `${month}-01`;
  const endDate = new Date(parseInt(month.split('-')[0]), parseInt(month.split('-')[1]), 0).toISOString().split('T')[0];

  const { data: schedules } = useQuery({
    queryKey: ['my-planner', month],
    queryFn: async () => {
      const { data } = await supabase.from('planner').select('*').eq('employee_id', user!.id).gte('date', startDate).lte('date', endDate).order('date');
      return data || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('planner').upsert({
        employee_id: user!.id, date, shift, time_slot: timeSlot,
      }, { onConflict: 'employee_id,date' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-planner'] });
      toast.success('Availability saved');
      setDate(''); setShift(''); setTimeSlot('');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const availableSlots = shift === 'morning' ? MORNING_SLOTS : shift === 'evening' ? EVENING_SLOTS : [...MORNING_SLOTS, ...EVENING_SLOTS];
  const dayCount = schedules?.length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-semibold">My Availability</h2>
          <p className="text-sm text-muted-foreground">
            {dayCount}/15 days scheduled this month
            {dayCount < 15 && <span className="text-destructive ml-1">(need {15 - dayCount} more)</span>}
          </p>
        </div>
        <Input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-auto" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Add Availability</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} min={startDate} max={endDate} />
            </div>
            <div className="space-y-2">
              <Label>Shift</Label>
              <Select value={shift} onValueChange={v => { setShift(v); setTimeSlot(''); }}>
                <SelectTrigger><SelectValue placeholder="Select shift" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Time Slot</Label>
              <Select value={timeSlot} onValueChange={setTimeSlot}>
                <SelectTrigger><SelectValue placeholder="Select slot" /></SelectTrigger>
                <SelectContent>
                  {availableSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => addMutation.mutate()} disabled={!date || !shift || !timeSlot}>
            <Plus className="h-4 w-4 mr-1" /> Save
          </Button>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Time Slot</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules?.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.date}</TableCell>
                <TableCell><Badge variant="outline" className="capitalize">{s.shift}</Badge></TableCell>
                <TableCell>{s.time_slot}</TableCell>
              </TableRow>
            ))}
            {!schedules?.length && (
              <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No availability set</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
