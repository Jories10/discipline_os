import { useMemo, useState } from 'react'
import Modal from '@/components/Modal'
import Field, { buttonClass, inputClass } from '@/components/Field'
import { instantiateTemplate, templateDates } from '@/domain/routines'
import { formatShortDate, startOfWeek, toISODate, weekDates } from '@/domain/time'
import { useAppStore } from '@/stores/useAppStore'
import { useUiStore, type RoutineDialog } from '@/stores/useUiStore'
import ApplyPlanForm from './ApplyPlanForm'

type Props = { dialog: Extract<RoutineDialog, { type: 'apply' }> }

export default function ApplyTemplateDialog({ dialog }: Props) {
  const close = useUiStore((s) => s.closeRoutine)
  const templates = useAppStore((s) => s.templates)
  const options = dialog.scope ? templates.filter((t) => t.scope === dialog.scope) : templates

  const [templateId, setTemplateId] = useState(dialog.templateId ?? options[0]?.id ?? '')
  const [target, setTarget] = useState(dialog.targetDate ?? toISODate(new Date()))

  const template = templates.find((t) => t.id === templateId)
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(target)
  const incoming = useMemo(() => (template && validDate ? instantiateTemplate(template, target) : []), [template, target, validDate])
  const dates = template && validDate ? templateDates(template, target) : []

  const title = dialog.scope === 'week' ? 'Start a week from a template' : dialog.scope === 'day' ? 'Apply a template to a day' : 'Apply a template'

  return (
    <Modal title={title} onClose={close}>
      {options.length === 0 ? (
        <>
          <p className="mb-4 text-sm text-muted">There are no {dialog.scope ?? ''} templates yet. Create one on the Routine Templates page, or save a {dialog.scope ?? 'day or week'} from the planner.</p>
          <div className="flex justify-end"><button onClick={close} className={buttonClass}>Close</button></div>
        </>
      ) : (
        <div className="space-y-3">
          <Field label="Template">
            {(id) => (
              <select id={id} value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputClass}>
                {options.map((t) => <option key={t.id} value={t.id}>{t.name} ({t.scope})</option>)}
              </select>
            )}
          </Field>
          <Field label={template?.scope === 'week' ? 'Apply to the week containing' : 'Apply to date'}>
            {(id) => <input id={id} type="date" value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass} />}
          </Field>
          {template && validDate && (
            <p className="text-xs text-muted">
              {template.scope === 'week'
                ? `Week of ${formatShortDate(startOfWeek(target))} to ${formatShortDate(weekDates(target)[6])}`
                : formatShortDate(target)}
            </p>
          )}
          <ApplyPlanForm
            incoming={incoming}
            dates={dates}
            confirmLabel="Apply template"
            successMessage="Template applied"
            allowReplace
            onDone={close}
            onCancel={close}
          />
        </div>
      )}
    </Modal>
  )
}
