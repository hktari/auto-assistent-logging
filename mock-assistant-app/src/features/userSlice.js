import { createSlice } from '@reduxjs/toolkit'

export const userSlice = createSlice({
    name: 'user',
    initialState: {
        id: "",
        username: "",
        password: "",
        cur_action: "",
    },
    reducers: {
        setCurAction(state, action){
            state.action = action;
        },
        setUser(state, action){
            state.id = action.payload.id;
            state.username = action.payload.username;
            state.password = action.payload.password;
            state.cur_action = action.payload.cur_action;
        }
    },
})

// Action creators are generated for each case reducer function
export const { setUser, setCurAction } = userSlice.actions

export default userSlice.reducer