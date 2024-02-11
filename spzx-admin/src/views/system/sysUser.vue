<template>

  <!---搜索表单-->
  <div class="search-div">
    <el-form label-width="70px" size="small">
      <el-row>
        <el-col :span="12">
          <el-form-item label="关键字">
            <el-input v-model="queryDto.keyword"
                      style="width: 100%"
                      placeholder="用户名"
            ></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="创建时间">
            <el-date-picker v-model="createTimes"
                            type="daterange"
                            range-separator="To"
                            start-placeholder="开始时间"
                            end-placeholder="结束时间"
                            format="YYYY-MM-DD"
                            value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row style="display:flex">
        <el-button type="primary" size="small" @click="searchSysUser">
          搜索
        </el-button>
        <el-button size="small" @click="resetData">重置</el-button>
      </el-row>
    </el-form>
  </div>

  <!--添加按钮-->
  <div class="tools-div">
    <el-button type="success" size="small" @click="addShow">添 加</el-button>
  </div>

  <el-dialog v-model="dialogVisible" title="添加或修改" width="40%">
    <el-form label-width="120px">
      <el-form-item label="用户名">
        <el-input v-model="sysUser.userName"/>
      </el-form-item>
      <el-form-item v-if="sysUser.id == null" label="密码">
        <el-input type="password" show-password v-model="sysUser.password"/>
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="sysUser.name"/>
      </el-form-item>
      <el-form-item label="手机">
        <el-input v-model="sysUser.phone"/>
      </el-form-item>
      <el-form-item label="头像">
        <el-upload
            class="avatar-uploader"
            action="http://localhost:8501/admin/system/fileUpload"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
            :headers="headers"  
        >
          <img v-if="sysUser.avatar" :src="sysUser.avatar" class="avatar" />
          <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
        </el-upload>
      </el-form-item>
      <el-form-item label="描述">
        <el-input  v-model="sysUser.description"/>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submit">提交</el-button>
        <el-button @click="dialogVisible = false">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>

  <!---数据表格-->
  <el-table :data="list" style="width: 100%">
    <el-table-column prop="userName" label="用户名" />
    <el-table-column prop="name" label="姓名" />
    <el-table-column prop="phone" label="手机" />
    <el-table-column prop="avatar" label="头像" #default="scope">
      <img :src="scope.row.avatar" width="50" />
    </el-table-column>
    <el-table-column prop="description" label="描述" />
    <el-table-column prop="status" label="状态" #default="scope">
      {{ scope.row.status == 1 ? '正常' : '停用' }}
    </el-table-column>
    <el-table-column prop="createTime" label="创建时间" />
    <el-table-column label="操作" align="center" width="280" #default="scope">
      <el-button type="primary" size="small" @click="editSysUser(scope.row)">
        修改
      </el-button>
      <el-button type="danger" size="small" @click="deleteById(scope.row)">
        删除
      </el-button>
      <el-button type="warning" size="small" @click="showAssignRole(scope.row)">
        分配角色
      </el-button>
      <el-dialog v-model="dialogRoleVisible" title="分配角色" width="40%">
        <el-form label-width="80px">
          <el-form-item label="用户名">
            <el-input disabled :value="sysUser.userName"></el-input>
          </el-form-item>

          <el-form-item label="角色列表">
            <el-checkbox-group v-model="userRoleIds">
              <el-checkbox v-for="role in allRoles" :key="role.id" :label="role.id">
                {{ role.roleName }}
              </el-checkbox>
            </el-checkbox-group>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="doAssign">提交</el-button>
            <el-button @click="dialogRoleVisible = false">取消</el-button>
          </el-form-item>
        </el-form>
      </el-dialog>

    </el-table-column>
  </el-table>

  <el-pagination
      v-model:current-page="pageParams.page"
      v-model:page-size="pageParams.limit"
      :page-sizes="[10, 20, 50, 100]"
      @size-change="fetchData"
      @current-change="fetchData"
      layout="total, sizes, prev, pager, next"
      :total="total"
  />

</template>

<script setup>
import { ref , onMounted } from 'vue';
import { GetSysUserListByPage , SaveSysUser , DeleteSysUser , UpdateSysUser , DoAssignRoleToUser} from '@/api/sysUser';
import { GetAllRoleList } from '@/api/sysRole'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useApp } from '@/pinia/modules/app'


// 表格数据模型
// const list = ref([
//   {"id":1 , "username":"admin" , "name": "admin" , "phone":"13121034567" , "status":1 , "createTime": "2023-05-11"} ,
//   {"id":2 , "username":"admin" , "name": "admin" , "phone":"13121034567" , "status":1 , "createTime": "2023-05-11"}
// ]);

////用户列表
//表格数据模型
const list = ref([])
//分页条数据模型
const total = ref(0)
//分页
const pageParamsForm = {
  page: 1, //当前页
  limit: 3  //当前页显示数
}
const pageParams = ref(pageParamsForm)
//封装条件数据模型
const queryDto = ref({
  keyword: "",
  createTimeBegin: "",
  createTimeEnd: ""
})
//钩子函数
onMounted(()=>{
  fetchData()
})
//条件查询方法 axios调用
const createTimes = ref([])
const fetchData = async ()=>{
  //获取开始和结束时间
  if(createTimes.value.length == 2) {
    queryDto.value.createTimeBegin = createTimes.value[0]
    queryDto.value.createTimeEnd = createTimes.value[1]
  }
  const {data} = await GetSysUserListByPage(
      pageParams.value.page,
      pageParams.value.limit,
      queryDto.value)
  list.value = data.list
  total.value = data.total
  console.log(sysUser.value)
}

////用户的添加
const dialogVisible = ref(false)
const form = {
  // userName:"",
  // name: "" ,
  // phone: "" ,
  // password: "" ,
  // description:"",
  // avatar: ""
}
const sysUser = ref(form)
//点击添加按钮弹框
const addShow = ()=>{
  sysUser.value = {} 
  dialogVisible.value = true
  console.log(sysUser.value)
}
//提交方法
const submit = async ()=>{
  if(!sysUser.value.id){  //id值为空则进行添加操作
    const {code} = await SaveSysUser(sysUser.value)
    if(code === 200){
      dialogVisible.value = false //关闭弹窗
      ElMessage.success("添加操作成功") //提示信息
      fetchData() //刷新页面
    }
  }else { //id不为空则进行修改操作
    const {code,message} = await UpdateSysUser(sysUser.value)
    if(code === 200){
      dialogVisible.value = false
      ElMessage.success("修改操作成功")
      fetchData()
    }else {
      ElMessage.warning(message)
    }
  }
}

////用户修改
const editSysUser = (row)=>{
  //todo
  // console.log("before edit: "+sysUser.value.createTime)
  sysUser.value = {...row}
  // console.log("after edit: "+sysUser.value.createTime)
  dialogVisible.value = true
  console.log(sysUser.value)
}
////用户删除
const deleteById = (row)=>{
  ElMessageBox.confirm('此操作将永久删除记录，是否继续？','warning',{
    confirmButtonText:'确认删除',
    cancelButtonText:'我再想想',
    type:'warning',
  }).then(async ()=>{
    const {code} = await DeleteSysUser(row.id)
    if(code===200){
      ElMessage.success('删除操作成功')
      fetchData()
    }
  })
}
////搜索方法
const searchSysUser = ()=>{
  fetchData()
}

const resetData = ()=>{
  queryDto.value = {}
  fetchData()
}

////头像上传方法
const headers = {
  token: useApp().authorization.token     // 从pinia中获取token，在进行文件上传的时候将token设置到请求头中
}
////分配角色
// 角色列表
const userRoleIds = ref([])
const allRoles = ref([])
const dialogRoleVisible = ref(false)
const showAssignRole = async row => {
  sysUser.value = {...row}
  dialogRoleVisible.value = true
  
  //得到所有的角色
  const {code,message,data} = await GetAllRoleList(row.id)
  allRoles.value = data.allRolesList //与SysRoleServiceImpl中map的key名称一致
  
  //用户分配过的角色
  userRoleIds.value = data.sysUserRoles
}

// 图像上传成功以后的事件处理函数
const handleAvatarSuccess = (response, uploadFile) => {
  sysUser.value.avatar = response.data
}
////分配角色
const doAssign = async ()=>{
  let assignRoleVo = {
    userId: sysUser.value.id,
    roleIdList: userRoleIds.value 
  }
  const {code} = await DoAssignRoleToUser(assignRoleVo)
  if(code===200){
    ElMessage.success("操作成功")
    dialogRoleVisible.value = false
    fetchData()
  }
}

</script>

<style scoped>
.search-div {
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 3px;
  background-color: #fff;
}
.tools-div {
  margin: 10px 0;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 3px;
  background-color: #fff;
}
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>