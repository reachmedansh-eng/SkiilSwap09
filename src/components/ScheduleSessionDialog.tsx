import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSchedule: (data: { link: string; datetime: string }) => Promise<void> | void;
}

export function ScheduleSessionDialog({ open, onOpenChange, onSchedule }: Props) {
  const [link, setLink] = useState("");
  const [datetime, setDatetime] = useState("");
  const [loading, setLoading] = useState(false);

  console.log('ScheduleSessionDialog render:', { open, link, datetime });

  const handleSubmit = async () => {
    if (!link || !datetime) return;
    setLoading(true);
    console.log('Submitting schedule:', { link, datetime });
    await onSchedule({ link, datetime });
    setLoading(false);
    setLink("");
    setDatetime("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="pixel-corners border-4">
        <DialogHeader>
          <DialogTitle className="retro-text text-xl">📅 Schedule a Session</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Google Meet link</label>
            <Input
              placeholder="https://meet.google.com/xyz-abc-def"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              type="url"
              className="pixel-corners mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Date & time</label>
            <Input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              className="pixel-corners mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="pixel-corners" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="pixel-corners" onClick={handleSubmit} disabled={loading || !link || !datetime}>
            {loading ? 'Scheduling…' : 'Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
