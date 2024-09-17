import {
  Resolver,
  Query,
  Mutation,
  Args,
  Int,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { TasksService } from './tasks.service';
import { Task } from './entities/task.entity';
import { CreateTaskInput } from './dto/create-task.input';
import { UpdateTaskInput } from './dto/update-task.input';
import { Assignee } from './entities/assignee.entity';

@Resolver(() => Task)
export class TasksResolver {
  constructor(private readonly tasksService: TasksService) {}

  @Mutation(() => Task)
  createTask(@Args('createTaskInput') createTaskInput: CreateTaskInput) {
    return this.tasksService.create(createTaskInput);
  }

  @Query(() => [Task], { name: 'tasks' })
  findAll() {
    return this.tasksService.findAll();
  }

  @Query(() => [Task], { name: 'completedTasks' })
  findCompletedTasks() {
    return this.tasksService.findCompletedTasks();
  }

  @Query(() => Task, { name: 'task' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.tasksService.findOne(id);
  }

  @Mutation(() => Task)
  updateTask(
    @Args('id', { type: () => Int }) id: number,
    @Args('updateTaskInput') updateTaskInput: UpdateTaskInput,
  ) {
    return this.tasksService.update(id, updateTaskInput);
  }

  @Mutation(() => Task)
  removeTask(@Args('id', { type: () => Int }) id: number) {
    return this.tasksService.remove(id);
  }

  @ResolveField(() => [Assignee])
  assignees(@Parent() task: Task) {
    return [
      {
        id: 1,
        name: 'John Doe',
      },
      {
        id: 2,
        name: 'Jane Doe',
      },
    ];
  }
}
