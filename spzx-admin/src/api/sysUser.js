import request from '@/utils/request'
const base_api = '/admin/system/sysUser'
//用户列表
export const GetSysUserListByPage = (current,limit,queryDto) => {
    return request({
        //``模板字符串
        url: `${base_api}/findByPage/${current}/${limit}`, //接口路径
        method: 'post', //提交方式
        //接口@RequestBody 前端data：名称，以JSON格式进行传递
        //接口没有注解，前端params：名称
        data: queryDto, //其他参数
    })
}





/**
 * 用户添加
 * @param sysUser
 * @returns {*}
 * @constructor
 */
export const SaveSysUser = (sysUser)=> {
    return request({
        url: `${base_api}/saveSysUser`, //路径
        method: 'post',
        data: sysUser,  
    })
}

/**
 * 用户修改
 * @param sysUser
 * @returns {*}
 * @constructor
 */
export const UpdateSysUser = (sysUser)=> {
    return request({
        url: `${base_api}/updateSysUser`, //路径
        method: 'put',
        data:sysUser,
    })
}

/**
 * 删除用户
 * @param userId
 * @returns {*}
 * @constructor
 */
export const DeleteSysUser = (userId)=> {
    return request({
        url: `${base_api}/deleteById/${userId}`, //路径
        method: 'delete',
    })
}
