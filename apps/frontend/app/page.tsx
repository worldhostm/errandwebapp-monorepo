import HomeClient from './components/HomeClient'
import JsonLd, { organizationSchema, serviceSchema, webApplicationSchema } from '../components/JsonLd'

export default function Home() {
  return (
    <>
      <JsonLd data={organizationSchema} />
      <JsonLd data={serviceSchema} />
      <JsonLd data={webApplicationSchema} />
      <HomeClient />
    </>
  )
}
