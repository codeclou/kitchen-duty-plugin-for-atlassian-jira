package ut.io.codeclou.kitchen.duty;

import org.junit.Test;
import io.codeclou.kitchen.duty.api.MyPluginComponent;
import io.codeclou.kitchen.duty.impl.MyPluginComponentImpl;

import static org.junit.Assert.assertEquals;

public class MyComponentUnitTest
{
    @Test
    public void testMyName()
    {
        MyPluginComponent component = new MyPluginComponentImpl(null);
        assertEquals("names do not match!", "myComponent",component.getName());
    }
}