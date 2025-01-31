import React from 'react'
import {useFormValue} from '@sanity/react-hooks'

const TotalBudgetInput = React.forwardRef((props, ref) => {
  const materials = useFormValue(['materials']) || []

  const totalBudget = materials.reduce((sum, item) => {
    const {material, quantity} = item
    const price = material?.price || 0
    const pieces = material?.pieces || 1
    return sum + (quantity / pieces) * price
  }, 0)

  return (
    <div>
      <h3>Total Budget: {totalBudget}</h3>
      <input type="hidden" value={totalBudget} ref={ref} {...props} />
    </div>
  )
})

export default TotalBudgetInput
