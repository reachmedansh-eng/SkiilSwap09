import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { RetroBackground } from "@/components/RetroBackground";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    // Initialize from localStorage or system preference
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return document.documentElement.classList.contains('dark');
  });
  const [emailNotif, setEmailNotif] = useState(() => {
    const stored = localStorage.getItem('emailNotif');
    return stored !== null ? stored === 'true' : true;
  });
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      const { data } = await supabase
        .from("profiles")
        .select("username, bio, avatar_url")
        .eq("id", session.user.id)
        .single();
      if (data) {
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    };
    init();
  }, [navigate]);

  const saveProfile = async () => {
    if (!userId) {
      toast.error("User ID not found. Please sign out and sign in again.");
      return;
    }
    
    // Get user email for profile creation
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      toast.error("User email not found!");
      return;
    }
    
    const dataToSave = { 
      id: userId,
      email: user.email,
      username: username.trim() || user.email.split('@')[0], // Use email prefix if username empty
      bio: bio.trim(), 
      avatar_url: avatarUrl 
    };
    
    console.log('Upserting profile with data:', dataToSave);
    
    // Use UPSERT to create profile if it doesn't exist, or update if it does
    const { data, error } = await supabase
      .from("profiles")
      .upsert(dataToSave, { onConflict: 'id' })
      .select();
    
    if (error) {
      toast.error("Could not save profile: " + error.message);
      console.error('Save error:', error);
      alert(`ERROR DETAILS:\nMessage: ${error.message}\nCode: ${error.code}\nDetails: ${error.details}`);
    } else {
      console.log('Profile saved successfully. Returned data:', data);
      toast.success("Profile saved! Redirecting to Dashboard...");
      
      // Navigate to Dashboard to see changes
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      console.log('Uploading file:', fileName);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(uploadData.path);
      setAvatarUrl(publicUrl.publicUrl);
      console.log('Avatar URL set to:', publicUrl.publicUrl);
      toast.success('Avatar uploaded! Click "Save Changes" to persist.');
    } catch (err: any) {
      console.error('Upload failed:', err);
      if (err.message.includes('not found')) {
        toast.error('Storage bucket not found. Please create "avatars" bucket in Supabase Dashboard → Storage');
      } else {
        toast.error(err.message || 'Upload failed');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('emailNotif', String(emailNotif));
  }, [emailNotif]);

  if (loading) return <div className="min-h-screen bg-background" />;

  return (
    <div className="min-h-screen bg-secondary/5 relative">
      <RetroBackground />
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Personalization</CardTitle>
            <CardDescription>Update how your profile appears to others</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Left: Large square avatar */}
              <div className="w-full">
                <div className="w-full aspect-square max-h-[520px] bg-muted/30 border-4 border-primary/30 pixel-corners overflow-hidden">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">👤</div>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={onFileChange} className="hidden" />
                  <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="pixel-corners">
                    {uploading ? 'Uploading...' : 'Upload Image'}
                  </Button>
                  <Button variant="outline" onClick={() => { setAvatarUrl(null); }} className="pixel-corners">Remove</Button>
                </div>
              </div>

              {/* Right: Username & Bio */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea id="bio" rows={8} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." />
                </div>
                <div className="flex gap-3">
                  <Button onClick={saveProfile} className="pixel-corners">Save Changes</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Customize your app experience (local)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use a dark theme across the app</p>
              </div>
              <Switch checked={darkMode} onCheckedChange={setDarkMode} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about your swaps</p>
              </div>
              <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Delete your account and profile data</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" className="pixel-corners" onClick={() => setConfirmDelete(true)}>
              Delete my account
            </Button>
            <p className="text-sm text-muted-foreground mt-2">This removes your profile data. For full account deletion, you must confirm via email.</p>
          </CardContent>
        </Card>

        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete your profile data and sign you out. We will also send an email to confirm deletion of your authentication account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={async () => {
                if (!userId) return;
                const { error } = await supabase.from('profiles').delete().eq('id', userId);
                if (error) {
                  toast.error('Failed to delete profile');
                  return;
                }
                await supabase.auth.signOut();
                toast.success('Profile deleted. Please check your email to finalize account deletion.');
                setConfirmDelete(false);
                navigate('/');
              }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
