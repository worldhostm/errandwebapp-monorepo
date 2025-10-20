'use client'


export type UserType = 'receiver' | 'requester' | 'performer'

interface UserTypeTabsProps {
  activeTab: UserType
  onTabChange: (tab: UserType) => void
}

export default function UserTypeTabs({ activeTab, onTabChange }: UserTypeTabsProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-6">
          <button
            onClick={() => onTabChange('receiver')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'receiver'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-black hover:text-black hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🔍</span>
              <span className="text-black">심부름 찾기</span>
            </div>
            <div className="text-xs text-black mt-1">
              주변 심부름을 찾아보세요
            </div>
          </button>
          
          <button
            onClick={() => onTabChange('performer')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'performer'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-black hover:text-black hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">🏃‍♂️</span>
              <span className="text-black">내 수행 심부름</span>
            </div>
            <div className="text-xs text-black mt-1">
              수락한 심부름을 관리하세요
            </div>
          </button>
          
          <button
            onClick={() => onTabChange('requester')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requester'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-black hover:text-black hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📝</span>
              <span className="text-black">내 의뢰 심부름</span>
            </div>
            <div className="text-xs text-black mt-1">
              등록한 심부름을 관리하세요
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}