import {useClient} from 'sanity'
import {useDocumentOperation} from 'sanity'

export function UpdateTotalBudgetAction(props) {
  const {patch, publish} = useDocumentOperation(props.id, props.type)
  const client = useClient({apiVersion: '2023-01-01'}) // Adjust API version as needed

  async function calculateBudget() {
    const project = await client.fetch(
      `*[_type == "project" && _id == $id][0]{
        materials[]->{
          material->{
            price,
            pieces
          },
          quantity
        }
      }`,
      {id: props.id},
    )

    if (!project || !project.materials) return

    let totalBudget = 0

    project.materials.forEach((item) => {
      const price = item.material?.price || 0
      const pieces = item.material?.pieces || 1
      totalBudget += (item.quantity / pieces) * price
    })

    patch.execute([{set: {totalBudget}}])
    publish.execute()
  }

  return {
    label: 'Update Total Budget',
    onHandle: async () => {
      await calculateBudget()
      props.onComplete() // Close the action menu
    },
  }
}
