interface Tab {
  label: string;
  value: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  tabs?: Tab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  action,
  tabs,
  activeTab,
  onTabChange,
}) => (
  <div className="mb-6">
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
      <div>
        <h1 className="text-2xl font-bold text-rotary-black">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-rotary-darkgray">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>

    {tabs && tabs.length > 0 && (
      <div className="flex flex-wrap gap-1 p-1 bg-white border border-gray-200 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => onTabChange?.(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              activeTab === tab.value
                ? "bg-rotary-royal text-white shadow-sm"
                : "text-rotary-darkgray hover:text-rotary-black hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    )}
  </div>
);

export default PageHeader;