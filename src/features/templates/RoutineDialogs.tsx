import { useUiStore } from '@/stores/useUiStore'
import ApplyTemplateDialog from './ApplyTemplateDialog'
import CarryForwardDialog from './CarryForwardDialog'
import CopyWeekDialog from './CopyWeekDialog'
import SaveTemplateDialog from './SaveTemplateDialog'
import TemplateEditor from './TemplateEditor'

/** Mounted once in the layout; any screen opens these through the UI store. */
export default function RoutineDialogs() {
  const dialog = useUiStore((s) => s.routineDialog)
  if (!dialog) return null
  switch (dialog.type) {
    case 'apply': return <ApplyTemplateDialog dialog={dialog} />
    case 'saveDay':
    case 'saveWeek': return <SaveTemplateDialog dialog={dialog} />
    case 'copyWeek': return <CopyWeekDialog toWeekStart={dialog.toWeekStart} />
    case 'carry': return <CarryForwardDialog weekStart={dialog.weekStart} />
    case 'editTemplate': return <TemplateEditor templateId={dialog.templateId} />
  }
}
