const {to} = require('await-to-js')
const {Sequelize, DataTypes} = require('sequelize')

const connection = new Sequelize(
    'latestCRUD',
    'root',
    'Rj12345@',
    {
        host : 'localhost',
        dialect : 'mysql'
    })

const coursesModel = connection.define('courses', {
    id:{
        type: DataTypes.BIGINT(11),
        autoIncrement:true,
        allowNull: false,
        primaryKey: true
    },
    name:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    },
    description:{
      type: DataTypes.STRING,
      notEmpty: true,
      notNull: true
    },
    availableSlots:{
        type: DataTypes.INTEGER,
        isInt: true,
        notNull: true
    }
})

const studentsModel = connection.define('students', {
    username:{
        type: DataTypes.STRING,
        allowNull: false,
        primaryKey: true
    },
    email:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    },
    password:{
        type: DataTypes.STRING,
        notEmpty: true,
        notNull: true
    }
})

const enrollmentModel = connection.define('enrollment', {
    course_id :{
        type: DataTypes.BIGINT(11),
        allowNull:false,
        references:{
            model: coursesModel,
            key: 'id'
        }
    },
    student_id :{
        type: DataTypes.BIGINT(11),
        allowNull:false,
        references:{
            model: coursesModel,
            key: 'id'
        }
    },
    student: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: studentsModel,
            key: 'username'
        }
    }
})

const connect = async ()=>{
    let [err, result] = await to ( connection.sync( {alter:true} ) )
    if (err){
        console.log(`Error: ${err.message}`)
        return
    }
    console.log(`Successfully connected to MySQL server !`)
}

module.exports = {
    connect, coursesModel, enrollmentModel, studentsModel
}