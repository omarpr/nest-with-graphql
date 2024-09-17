import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Task } from './entities/task.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async create(createTaskInput: CreateTaskInput) {
    const insertResult = await this.tasksRepository.insert(createTaskInput);
    const id = insertResult.identifiers[0].id;

    return await this.findOne(id);
  }

  findAll() {
    return this.tasksRepository.find();
  }

  findCompletedTasks() {
    return this.tasksRepository.find({
      where: {
        completed: true,
      },
    });
  }

  findOne(id: number) {
    return this.tasksRepository.findOne({
      where: {
        id,
      },
    });
  }

  async update(id: number, updateTaskInput: UpdateTaskInput) {
    const updateResult = await this.tasksRepository.update(id, updateTaskInput);

    if (updateResult.affected === 0) {
      throw new NotFoundException(`Task with ID "${id}" not found!`);
    }

    return await this.findOne(id);
  }

  async remove(id: number) {
    const task = await this.findOne(id);

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found!`);
    }

    await this.tasksRepository.delete(id);

    return task;
  }
}
