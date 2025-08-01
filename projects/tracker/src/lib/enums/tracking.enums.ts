export enum EventNames {
  
  GET_ALL_TRANSACTIONS = 'get_all_transactions',
  GET_TRANSACTION_DETAILS = 'get_transaction_details', 
  CREATE_TRANSACTION = 'create_transaction',
  UPDATE_TRANSACTION = 'update_transaction',
  DELETE_TRANSACTION = 'delete_transaction',
  
  
  GET_ALL_BUDGETS = 'get_all_budgets',
  CREATE_BUDGET = 'create_budget',
  UPDATE_BUDGET = 'update_budget',
  
  
  USER_LOGIN = 'user_login',
  USER_LOGOUT = 'user_logout',
  PAGE_VIEW = 'page_view',
  BUTTON_CLICK = 'button_click'
}

export enum Platform {
  HUB = '390Hub',
  WORK = '390Work',
  LEARN = '390Learn'
}