import { create, get, update, destroy, getSubAccounts, getParentAccounts } from '../controllers/assets'

export default [
  {
    method: 'POST',
    url: '/api/assets',
    handler: create,
  },
  {
    method: 'GET',
    url: '/api/assets',
    handler: get,
  },
  {
    method: 'GET',
    url: '/api/assets/parents',
    handler: getParentAccounts,
  },
  {
    method: 'GET',
    url: '/api/assets/:parentId/subaccounts',
    handler: getSubAccounts,
  },
  {
    method: 'PUT',
    url: '/api/assets',
    handler: update,
  },
  {
    method: 'DELETE',
    url: '/api/assets',
    handler: destroy,
  },
]
