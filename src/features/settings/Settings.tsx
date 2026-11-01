import CategoryManager from './CategoryManager'
import DataManagement from './DataManagement'

export default function Settings() {
  return (
    <div className="max-w-3xl space-y-10">
      <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
      <CategoryManager />
      <DataManagement />
    </div>
  )
}
