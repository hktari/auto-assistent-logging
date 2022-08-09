import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        id: "",
        username: "",
        password: "",
        action: "",
        logs: []
    },
    reducers: {
        setCurAction(state, action){
            state.action = action;
        },
        setUser(state, action){
            state.id = action.payload.id;
            state.username = action.payload.username;
            state.password = action.payload.password;
            state.action = action.payload.action;
            state.logs = [...action.payload.logs];
        }
    },
})

// Action creators are generated for each case reducer function
export const { setUser, setCurAction } = userSlice.actions

export default userSlice.reducer