import { notFound } from 'next/navigation'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import HeroHeader from '@/components/ui/HeroHeader'
import PriceSidebar from '@/components/ui/PriceSidebar'
import BenefitList from '@/components/ui/BenefitList'
import FaqAccordion from '@/components/ui/FaqAccordion'
import packagesData from '@/data/packages.json'

interface PackagePageProps {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  return packagesData.packages.map((pkg) => ({
    id: pkg.slug,
  }))
}

export default async function PackagePage({ params }: PackagePageProps) {
  const { id } = await params
  const packageData = packagesData.packages.find(pkg => pkg.slug === id)

  if (!packageData) {
    notFound()
  }

  const breadcrumbItems = [
    { label: 'แพ็กเกจ', href: '/plans' },
    { label: packageData.name }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />
        
        <HeroHeader packageData={packageData} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* What's Included */}
            <BenefitList 
              title="สิทธิที่ได้รับทั้งหมด"
              items={packageData.access}
            />

            {/* Benefits */}
            <BenefitList 
              title="ข้อดีของแพ็กเกจนี้"
              items={packageData.benefits}
              icon="🎯"
            />

            {/* Terms & Conditions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">เงื่อนไขการใช้งาน</h2>
              <ul className="space-y-2">
                {packageData.terms.map((term, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-amber-500 mr-3 mt-1">⚠</span>
                    <span className="text-gray-700">{term}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Testimonial Section */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">คำชมจากสมาชิก</h2>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-gray-700 italic mb-3">
                  "ชอบแพ็กเกจนี้มาก ใช้งานง่าย เครื่องไม่เต็ม และพนักงานดูแลดีมาก 
                  ตอนนี้ฟิตขึ้นเยอะเลย!"
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div className="ml-3">
                    <p className="font-medium text-gray-900">คุณอนัญญา</p>
                    <p className="text-sm text-gray-600">สมาชิก Economy 6 เดือน</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ */}
            <FaqAccordion faqs={packageData.faq} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <PriceSidebar 
              price={packageData.price}
              duration={packageData.duration}
              access={packageData.access}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export async function generateMetadata({ params }: PackagePageProps) {
  const { id } = await params
  const packageData = packagesData.packages.find(pkg => pkg.slug === id)

  if (!packageData) {
    return {
      title: 'แพ็กเกจไม่พบ | Private Fitness',
    }
  }

  return {
    title: `${packageData.name} | Private Fitness`,
    description: `แพ็กเกจ ${packageData.name} ราคา ${packageData.price} ${packageData.tagline} - Private Fitness`,
  }
}