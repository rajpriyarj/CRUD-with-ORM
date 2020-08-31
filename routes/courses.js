const express = require('express');
const router = express.Router();
const {to} = require('await-to-js')
const {checkToken} = require('./../middlewares/index');
const mysql = require('./../lib/datacenter/mysql/connection');
const Sequelize = require('sequelize');

router.get('/', async (req,res)=>{
    const [err, result] = await to(mysql.coursesModel.findAll());
    if (err){
        return res.json({
            data: null,
            error: "Error!!!"
        });
    }
    res.json({
        data: result,
        error: null
    })
});

router.get('/:id', checkToken, async (req,res)=>{
    let courseId = req.params.id;
    let [err, result] = await to(mysql.coursesModel.findAll({
        where:{
            id: courseId
        }
    }));
    if (err){
        return res.json({
            data: null,
            error: "Error!!!"
        })
    }
    if  (result.length === 0){
        return res.json({
            error: ` No course exist with id ${courseId} exist`
        });
    }
    let data = result[0];
    [err, result] = await to(mysql.coursesModel.findAll({
        where:{
            course_id: courseId
        }
    }));
    if (err){
        return res.json({
            data: null,
            error: "ERROR!!"
        });
    }
    data.enrolledStudents = result;
    res.json({
        data,
        error: null
    });
});

router.post('/', checkToken, async (req,res)=>{
    const name = req.body.name;
    const description = req.body.description;
    const availableSeats = req.body.availableSlots;
    if (!name || !description || !availableSeats || availableSeats <= 0){
        return res.json({
            error: "Invalid input data"
        });
    }

    let [err, result] = await to(mysql.coursesModel.findAll());
    let courseId = result.length+1;

    [err, result] = await to (mysql.coursesModel.create({
        id: courseId,
        name: name,
        description: description,
        availableSeats: availableSeats
    }));
    if (err) {
        if (err.code === "ER_DUP_ENTRY") {
            return res.json({
                error: "Course already exist"
            });
        } else {
            return res.json({
                data: null,
                error: "Some error occurred"
            });
        }
    }
    res.json({
        data: `Course created with id ${courseId}`,
        error: null
    })
});

router.post('/:id/enroll', checkToken, async (req,res)=>{
    const courseId = req.params.id;
    const studentId= req.body.id;
    let [err, result] = await to(mysql.coursesModel.findAll({
        where:{
            id: courseId
        }
    }));
    if(result === 0){
        res.json({
            message: `No course with id:${courseId}`
        });
    }

    let slots = result[0].availableSlots;

    [err, result] = await to(mysql.coursesModel.findAll({
        where:{
            id: studentId
        }
    }));
    let student = result[0];
    if(student == null){
        res.json({
            message: `No student with id:${studentId}`
        });
    }

    [err, result] = await to(mysql.enrollmentModel.findAll({
        where:{
            course_id: courseId,
            student_id: studentId
        }
    }));
    if (result.length > 0){
        res.json({
            message : "Student already enrolled "
        })
    } else if(err){
        return res.send({
            data : null,
            error : "Error"
        })
    }

    if (slots > 0 && result.length==0){
        [err, result] = await to(mysql.enrollmentModel.create({
            course_id: courseId,
            student_id: studentId,
            student: student.username
        }));
        if(!err){
            slots -= 1;
            await to(mysql.coursesModel.update({
                availableSlots: slots
            },
                {
                    where:{
                        id: courseId
                    }
                }));
            res.json({
                message: "Student enrolled successfully"
            })
        }
    } else{
        return res.json({
            "data":null,
            error:"No slots available"
        })
    }
});

router.put('/:id/deregister', checkToken, async (req,res)=>{
    const courseId = req.params.id;
    const studentId= req.body.id;
    let [err, result] = await to(mysql.coursesModel.findAll({
        where:{
            id: courseId
        }
    }));
    let course = result[0];
    if(course == null){
        res.json({
            message: `No course with id:${courseId}`
        });
    }

    [err, result] = await to(mysql.studentsModel.findAll({
        where:{
            id: studentId
        }
    }));
    let student = result[0];
    if(student === 0){
        res.json({
            message: `No student with id:${studentId}`
        });
    }

    let slots = course.availableSlots;

    [err, result] = await to(
        mysql.enrollmentModel.findAll({
            where:{
                course_id: courseId,
                student: student.username
            }
            }));
    if (result.length == 0){
        return res.send({
            message: "No such student enrolled"
        })
    }
    if(err) {
        return res.send({
            "data":null,
            error
        })
    }

    [err, result] = await to(
        mysql.enrollmentModel.destroy({
            where:{
                course_id: courseId,
                student: student.username
            }
        }));
    if(!err){
        slots += 1;
        mysql.coursesModel.update({
            availableSlots: slots},{
            where:{
                id: courseId
            }
        });
        res.json({
            "Message": "Student deregistered successfully"
        })
    } else {
        return res.send({
            data: null,
            error });
    }

});

/* {
    "data": {
        "fieldCount": 0,
        "affectedRows": 1,
        "insertId": 0,
        "serverStatus": 2,
        "warningCount": 0,
        "message": "",
        "protocol41": true,
        "changedRows": 0
    }
    * This is sample response of DB
*/

router.delete('/:id', checkToken, async(req, res)=>{
    let courseId = req.params.id;
    let[err, result] = await to(mysql.coursesModel.destroy({
        where:{
            id: courseId
        }
    }));
    if (err){
        return res.json({
            data: null,
            error: "Error!!!"
        });
    }
    if (result.affectedRows === 0){
        return res.json({
            data: null,
            error: `No Course with ID: ${courseId}`
        });
    }

    [error, result] = await to(mysql.enrollmentModel.destroy({
        where:{
            course_id: courseId
        }
    }));
    if (error) {
        return res.json({
            data: null,
            error: "Error!"
        });
    }

    res.json({
        data:'Success',
        error:null
    });
});

module.exports = router;