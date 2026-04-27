'use client';
import { useState } from 'react';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { toast } from 'sonner';
import {
  Building2,
  Plus,
  Pencil,
  Trash2,
  Webhook as WebhookIcon,
  Activity,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { api, type Company } from '@/lib/api';

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function CompaniesPage() {
  const { data: companies = [], isLoading } = useSWR<Company[]>('/api/companies');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);

  const onCreated = () => {
    setOpen(false);
    setEditing(null);
    mutate('/api/companies');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" /> Companies
          </h1>
          <p className="text-sm text-muted-foreground">
            Each company groups its own webhooks under a URL slug
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" />
              New company
            </Button>
          </DialogTrigger>
          <CompanyForm onSaved={onCreated} />
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : companies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Building2 className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p className="mb-4">No companies yet — create your first to get started.</p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              New company
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <CompanyCard
              key={c._id}
              company={c}
              onEdit={() => setEditing(c)}
            />
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        {editing && <CompanyForm company={editing} onSaved={onCreated} />}
      </Dialog>
    </div>
  );
}

function CompanyCard({ company, onEdit }: { company: Company; onEdit: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/companies/${company._id}`);
      toast.success('Company deleted');
      mutate('/api/companies');
      setConfirming(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="transition-colors hover:border-primary/40">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/companies/${company._id}`}
              className="font-semibold text-lg hover:underline truncate block"
            >
              {company.name}
            </Link>
            <code className="text-xs text-muted-foreground">/{company.slug}</code>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setConfirming(true)}
              aria-label="Delete"
            >
              <Trash2 className="h-4 w-4 text-rose-500" />
            </Button>
          </div>
        </div>
        {company.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{company.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t">
          <span className="inline-flex items-center gap-1">
            <WebhookIcon className="h-3 w-3" /> {company.webhookCount ?? 0} hooks
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3" /> {company.requestCount ?? 0} requests
          </span>
        </div>
      </CardContent>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &quot;{company.name}&quot;?</DialogTitle>
            <DialogDescription>
              This deletes the company, all its webhooks, and all captured requests. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirming(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function CompanyForm({
  company,
  onSaved,
}: {
  company?: Company;
  onSaved: () => void;
}) {
  const isEdit = !!company;
  const [name, setName] = useState(company?.name ?? '');
  const [slug, setSlug] = useState(company?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [description, setDescription] = useState(company?.description ?? '');
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (isEdit) {
        await api.patch(`/api/companies/${company!._id}`, { name, slug, description });
        toast.success('Company updated');
      } else {
        await api.post('/api/companies', { name, slug, description });
        toast.success('Company created');
      }
      onSaved();
    } catch (e: any) {
      toast.error(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogContent>
      <form onSubmit={onSubmit} className="space-y-4">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit company' : 'New company'}</DialogTitle>
          <DialogDescription>
            The slug becomes part of the webhook URL: <code>/&lt;slug&gt;/&lt;webhook-path&gt;</code>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="MEAN Consultor"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug</Label>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="mean-consultor"
            pattern="^[a-z0-9]+(-[a-z0-9]+)*$"
            required
          />
          <p className="text-xs text-muted-foreground">lowercase, kebab-case</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="font-sans"
          />
        </div>

        <DialogFooter>
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
